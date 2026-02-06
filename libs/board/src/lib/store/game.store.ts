import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState, type } from '@ngrx/signals';
import { withEntities, addEntity, updateEntity, removeAllEntities } from '@ngrx/signals/entities';
import { Pokemon, Spot, Passage, createPokemon, getSpecies } from '../models/board.models';
import { BattleResult, GameState, initialGameState } from './game.types';
import { executeBattle } from './battle.utils';
import { findReachableSpots, findReachableSpotsFromEntry } from './movement.utils';

// Re-export types for consumers
export type { BattleResult } from './game.types';

// ============================================================================
// Store Definition
// ============================================================================

export const GameStore = signalStore(
  // Game State
  withState(initialGameState),

  // Entity collection for Pokemon
  withEntities({ entity: type<Pokemon>(), collection: 'pokemon' }),

  // Computed values
  withComputed(({ pokemonEntities, pokemonEntityMap, currentPlayerId, spots, passages }) => ({
    // Spot map for O(1) lookups (spots are in state, not entity collection)
    spotMap: computed(() => {
      const map: Record<string, Spot> = {};
      for (const spot of spots()) {
        map[spot.id] = spot;
      }
      return map;
    }),

    // Pokemon by location
    pokemonOnBoard: computed(() => pokemonEntities().filter((p) => p.spotId !== null)),

    benchPokemon: computed(() => pokemonEntities().filter((p) => p.spotId === null)),

    // Pokemon by player
    currentPlayerPokemon: computed(() =>
      pokemonEntities().filter((p) => p.playerId === currentPlayerId()),
    ),

    currentPlayerBench: computed(() =>
      pokemonEntities().filter((p) => p.playerId === currentPlayerId() && p.spotId === null),
    ),

    // Get Pokemon at a specific spot
    getPokemonAtSpot: computed(
      () => (spotId: string) => pokemonEntities().find((p) => p.spotId === spotId),
    ),

    // Get occupied spot IDs by current player
    ownOccupiedSpotIds: computed(
      () =>
        new Set(
          pokemonEntities()
            .filter((p) => p.spotId !== null && p.playerId === currentPlayerId())
            .map((p) => p.spotId!),
        ),
    ),

    // Get occupied spot IDs by enemies
    enemyOccupiedSpotIds: computed(
      () =>
        new Set(
          pokemonEntities()
            .filter((p) => p.spotId !== null && p.playerId !== currentPlayerId())
            .map((p) => p.spotId!),
        ),
    ),

    // Get all occupied spot IDs (for backward compatibility)
    occupiedSpotIds: computed(
      () =>
        new Set(
          pokemonEntities()
            .filter((p) => p.spotId !== null)
            .map((p) => p.spotId!),
        ),
    ),

    // Get player's entry spots
    getPlayerEntrySpots: computed(
      () => (playerId: number) =>
        spots().filter(
          (s) =>
            s.metadata.type === 'entry' &&
            'playerId' in s.metadata &&
            s.metadata.playerId === playerId,
        ),
    ),

    // Get player's flag spot
    getPlayerFlagSpot: computed(
      () => (playerId: number) =>
        spots().find(
          (s) =>
            s.metadata.type === 'flag' &&
            'playerId' in s.metadata &&
            s.metadata.playerId === playerId,
        ),
    ),

    // Get opponent's flag spot
    getOpponentFlagSpot: computed(() => {
      const current = currentPlayerId();
      const opponent = current === 1 ? 2 : 1;
      return spots().find(
        (s) =>
          s.metadata.type === 'flag' &&
          'playerId' in s.metadata &&
          s.metadata.playerId === opponent,
      );
    }),
  })),

  // Methods
  withMethods((store) => ({
    // Initialize game with board data
    initializeGame(spots: Spot[], passages: Passage[], playerCount: number = 2): void {
      patchState(store, {
        spots,
        passages,
        playerCount,
        currentPlayerId: 1,
        phase: 'playing',
        winnerId: null,
        lastBattle: null,
        selectedPokemonId: null,
        validMoveTargets: [],
      });
    },

    // Add Pokemon to a player's bench
    addPokemonToBench(speciesId: string, playerId: number): void {
      const pokemon = createPokemon({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        speciesId,
        playerId,
      });
      patchState(store, addEntity(pokemon, { collection: 'pokemon' }));
    },

    // Setup initial Pokemon for both players
    setupInitialPokemon(): void {
      const benchSpecies = ['venusaur', 'blastoise', 'charizard'];

      // Give each player Pokemon
      for (let playerId = 1; playerId <= store.playerCount(); playerId++) {
        // Find player's flag spot for starting Snorlax
        const flagSpot = store
          .spots()
          .find(
            (s) =>
              s.metadata.type === 'flag' &&
              'playerId' in s.metadata &&
              s.metadata.playerId === playerId,
          );

        // Place Snorlax at the flag spot
        const snorlax = createPokemon({
          id: `${Date.now()}-${playerId}-snorlax-${Math.random().toString(36).substring(2, 9)}`,
          speciesId: 'snorlax',
          playerId,
          spotId: flagSpot?.id ?? null,
        });
        patchState(store, addEntity(snorlax, { collection: 'pokemon' }));

        // Add remaining Pokemon to bench
        for (const speciesId of benchSpecies) {
          const pokemon = createPokemon({
            id: `${Date.now()}-${playerId}-${speciesId}-${Math.random().toString(36).substring(2, 9)}`,
            speciesId,
            playerId,
          });
          patchState(store, addEntity(pokemon, { collection: 'pokemon' }));
        }
      }
    },

    // Select a Pokemon
    selectPokemon(id: string | null): void {
      // Clear last battle when starting a new selection
      patchState(store, { lastBattle: null });

      if (!id || store.phase() === 'ended') {
        patchState(store, { selectedPokemonId: null, validMoveTargets: [] });
        return;
      }

      const pokemon = store.pokemonEntityMap()[id];
      if (!pokemon || pokemon.playerId !== store.currentPlayerId()) {
        return; // Can only select own Pokemon
      }

      const species = getSpecies(pokemon.speciesId);
      if (!species) {
        patchState(store, { selectedPokemonId: id, validMoveTargets: [] });
        return;
      }

      let validTargets: string[] = [];
      const ownOccupied = store.ownOccupiedSpotIds();
      const enemyOccupied = store.enemyOccupiedSpotIds();

      if (pokemon.spotId === null) {
        // Pokemon is on bench - can enter via entry spots and use full movement
        const entrySpots = store.getPlayerEntrySpots()(pokemon.playerId);
        const allTargets = new Set<string>();

        for (const entrySpot of entrySpots) {
          // If entry spot is unoccupied by own Pokemon, can reach spots from there
          if (!ownOccupied.has(entrySpot.id)) {
            // Can land on entry spot itself (uses all moves)
            if (!enemyOccupied.has(entrySpot.id)) {
              allTargets.add(entrySpot.id);
            }
            // Can also reach spots beyond entry with remaining moves
            const reachableFromEntry = findReachableSpotsFromEntry(
              entrySpot.id,
              species.movement,
              store.spots(),
              store.passages(),
              ownOccupied,
              enemyOccupied,
            );
            reachableFromEntry.forEach((id) => allTargets.add(id));
          }
        }

        validTargets = Array.from(allTargets);
      } else {
        // Pokemon is on board - calculate reachable spots
        validTargets = findReachableSpots(
          pokemon.spotId,
          species.movement,
          store.spots(),
          store.passages(),
          ownOccupied,
          enemyOccupied,
        );
      }

      patchState(store, { selectedPokemonId: id, validMoveTargets: validTargets });
    },

    // Move Pokemon to a spot (includes battle handling and win check)
    movePokemon(
      pokemonId: string,
      targetSpotId: string,
    ): { success: boolean; battle?: BattleResult; won?: boolean } {
      const pokemon = store.pokemonEntityMap()[pokemonId];
      if (!pokemon) return { success: false };

      // Verify it's a valid move
      if (!store.validMoveTargets().includes(targetSpotId)) {
        return { success: false };
      }

      // Check if there's an enemy Pokemon at the target (battle!)
      const defender = store
        .pokemonEntities()
        .find((p) => p.spotId === targetSpotId && p.playerId !== pokemon.playerId);

      let battleResult: BattleResult | undefined;

      if (defender) {
        // Check if defender is on a flag spot (normal types get bonus)
        const targetSpot = store.spotMap()[targetSpotId];
        const defenderOnFlagSpot = targetSpot?.metadata.type === 'flag';

        // Execute battle
        battleResult = executeBattle(pokemon, defender, defenderOnFlagSpot);
        patchState(store, { lastBattle: battleResult });

        if (battleResult.winnerId === pokemon.id) {
          // Attacker wins - defender goes back to bench
          patchState(
            store,
            updateEntity({ id: defender.id, changes: { spotId: null } }, { collection: 'pokemon' }),
            updateEntity(
              { id: pokemonId, changes: { spotId: targetSpotId } },
              { collection: 'pokemon' },
            ),
          );
        } else {
          // Defender wins - attacker goes back to bench
          patchState(
            store,
            updateEntity({ id: pokemonId, changes: { spotId: null } }, { collection: 'pokemon' }),
          );
        }
      } else {
        // No battle - just move
        patchState(
          store,
          updateEntity(
            { id: pokemonId, changes: { spotId: targetSpotId } },
            { collection: 'pokemon' },
          ),
        );
      }

      // Check win condition - did the moving Pokemon reach opponent's flag?
      const movedPokemon = store.pokemonEntityMap()[pokemonId];
      if (movedPokemon?.spotId === targetSpotId) {
        const opponentFlag = store.getOpponentFlagSpot();
        if (opponentFlag && targetSpotId === opponentFlag.id) {
          // Current player wins!
          patchState(store, {
            phase: 'ended',
            winnerId: store.currentPlayerId(),
            selectedPokemonId: null,
            validMoveTargets: [],
          });
          return { success: true, battle: battleResult, won: true };
        }
      }

      // Clear selection
      patchState(store, {
        selectedPokemonId: null,
        validMoveTargets: [],
      });

      return { success: true, battle: battleResult };
    },

    // End current player's turn
    endTurn(): void {
      if (store.phase() === 'ended') return;

      const nextPlayer = (store.currentPlayerId() % store.playerCount()) + 1;
      patchState(store, {
        currentPlayerId: nextPlayer,
        selectedPokemonId: null,
        validMoveTargets: [],
        // Keep lastBattle visible until next player acts
      });
    },

    // Clear the last battle result (called when starting a new action)
    clearBattle(): void {
      patchState(store, { lastBattle: null });
    },

    // Clear selection
    clearSelection(): void {
      patchState(store, { selectedPokemonId: null, validMoveTargets: [] });
    },

    // Reset game - clears all Pokemon and resets state
    resetGame(): void {
      patchState(store, removeAllEntities({ collection: 'pokemon' }), {
        currentPlayerId: 1,
        selectedPokemonId: null,
        validMoveTargets: [],
        phase: 'playing',
        winnerId: null,
        lastBattle: null,
      });
    },
  })),
);
