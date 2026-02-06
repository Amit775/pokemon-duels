import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState, type } from '@ngrx/signals';
import {
  withEntities,
  addEntity,
  removeEntity,
  updateEntity,
  setAllEntities,
  removeAllEntities,
} from '@ngrx/signals/entities';
import { Pokemon, Spot, Passage, PokemonType, POKEMON_SPECIES, createPokemon, getSpecies } from '../models/board.models';

// ============================================================================
// State Types
// ============================================================================

type BattleResult = {
  attackerId: string;
  defenderId: string;
  attackerRoll: number;
  defenderRoll: number;
  attackerBonus: number;
  defenderBonus: number;
  winnerId: string;
  loserId: string;
};

type GameState = {
  /** Current player's turn (1-4) */
  currentPlayerId: number;
  /** Number of players in the game */
  playerCount: number;
  /** Currently selected Pokemon ID */
  selectedPokemonId: string | null;
  /** Spot IDs that the selected Pokemon can move to (including enemy-occupied for battles) */
  validMoveTargets: string[];
  /** Game phase */
  phase: 'setup' | 'playing' | 'ended';
  /** Winner player ID (null if game not ended) */
  winnerId: number | null;
  /** Last battle result for UI display */
  lastBattle: BattleResult | null;
  /** Spots loaded from board */
  spots: Spot[];
  /** Passages loaded from board */
  passages: Passage[];
};

const initialGameState: GameState = {
  currentPlayerId: 1,
  playerCount: 2,
  selectedPokemonId: null,
  validMoveTargets: [],
  phase: 'setup',
  winnerId: null,
  lastBattle: null,
  spots: [],
  passages: [],
};

// ============================================================================
// Type Advantage System
// ============================================================================

/**
 * Calculate type advantage bonus
 * Fire > Grass, Water > Fire, Grass > Water
 */
function getTypeAdvantageBonus(attackerType: PokemonType, defenderType: PokemonType): number {
  if (attackerType === 'fire' && defenderType === 'grass') return 1;
  if (attackerType === 'water' && defenderType === 'fire') return 1;
  if (attackerType === 'grass' && defenderType === 'water') return 1;
  return 0;
}

/**
 * Roll a dice (1-6)
 */
function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Execute a battle between two Pokemon
 * @param defenderOnFlagSpot - true if defender is on a flag spot (normal types get +1)
 */
function executeBattle(attacker: Pokemon, defender: Pokemon, defenderOnFlagSpot: boolean): BattleResult {
  const attackerSpecies = getSpecies(attacker.speciesId);
  const defenderSpecies = getSpecies(defender.speciesId);

  const attackerRoll = rollDice();
  const defenderRoll = rollDice();
  
  const attackerBonus = getTypeAdvantageBonus(
    attackerSpecies?.type ?? 'normal',
    defenderSpecies?.type ?? 'normal'
  );
  
  // Defender gets type advantage + flag spot bonus for normal types
  let defenderBonus = getTypeAdvantageBonus(
    defenderSpecies?.type ?? 'normal',
    attackerSpecies?.type ?? 'normal'
  );
  
  // Normal-type Pokemon get +1 when defending on Flag spot
  if (defenderOnFlagSpot && defenderSpecies?.type === 'normal') {
    defenderBonus += 1;
  }

  const attackerTotal = attackerRoll + attackerBonus;
  const defenderTotal = defenderRoll + defenderBonus;

  // Defender wins ties
  const attackerWins = attackerTotal > defenderTotal;

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerRoll,
    defenderRoll,
    attackerBonus,
    defenderBonus,
    winnerId: attackerWins ? attacker.id : defender.id,
    loserId: attackerWins ? defender.id : attacker.id,
  };
}

// ============================================================================
// Movement Calculation
// ============================================================================

/**
 * Find all spots reachable within N moves using BFS
 * Now includes enemy-occupied spots (for battles) but not own-occupied spots
 */
function findReachableSpots(
  startSpotId: string,
  maxMoves: number,
  spots: Spot[],
  passages: Passage[],
  ownOccupiedSpotIds: Set<string>,
  enemyOccupiedSpotIds: Set<string>
): string[] {
  if (maxMoves <= 0) return [];

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const spot of spots) {
    adjacency.set(spot.id, []);
  }
  for (const passage of passages) {
    adjacency.get(passage.fromSpotId)?.push(passage.toSpotId);
    adjacency.get(passage.toSpotId)?.push(passage.fromSpotId);
  }

  // BFS with distance tracking
  const reachable: string[] = [];
  const visited = new Map<string, number>(); // spotId -> distance
  const queue: { spotId: string; distance: number }[] = [{ spotId: startSpotId, distance: 0 }];
  visited.set(startSpotId, 0);

  while (queue.length > 0) {
    const { spotId, distance } = queue.shift()!;
    const isStartingSpot = distance === 0;

    if (distance > 0) {
      // Can't land on own Pokemon
      if (!ownOccupiedSpotIds.has(spotId)) {
        reachable.push(spotId);
      }
    }

    // Can't move through enemy Pokemon (battle stops movement)
    // Can't move through own Pokemon either
    // BUT: starting spot (distance 0) is where the Pokemon IS, so allow exploring from it
    const isBlockedByOwn = !isStartingSpot && ownOccupiedSpotIds.has(spotId);
    const isBlockedByEnemy = enemyOccupiedSpotIds.has(spotId);
    const isBlocked = isBlockedByOwn || isBlockedByEnemy;
    
    if (distance < maxMoves && !isBlocked) {
      const neighbors = adjacency.get(spotId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, distance + 1);
          queue.push({ spotId: neighbor, distance: distance + 1 });
        }
      }
    }
  }

  return reachable;
}

/**
 * Find reachable spots from entry point (for Pokemon leaving bench)
 * Entry spot itself costs 1 movement, so remaining moves is (totalMoves - 1)
 */
function findReachableSpotsFromEntry(
  entrySpotId: string,
  totalMoves: number,
  spots: Spot[],
  passages: Passage[],
  ownOccupiedSpotIds: Set<string>,
  enemyOccupiedSpotIds: Set<string>
): string[] {
  // Entry counts as 1 move, so remaining moves are (totalMoves - 1)
  const remainingMoves = totalMoves - 1;
  if (remainingMoves <= 0) return []; // No further movement after entry
  return findReachableSpots(entrySpotId, remainingMoves, spots, passages, ownOccupiedSpotIds, enemyOccupiedSpotIds);
}

// ============================================================================
// Store Definition
// ============================================================================

export const GameStore = signalStore(
  // Game State
  withState(initialGameState),

  // Entity collection for Pokemon
  withEntities({ entity: type<Pokemon>(), collection: 'pokemon' }),

  // Computed values
  withComputed(({ pokemonEntities, currentPlayerId, spots, passages }) => ({
    // Pokemon by location
    pokemonOnBoard: computed(() => 
      pokemonEntities().filter(p => p.spotId !== null)
    ),
    
    benchPokemon: computed(() => 
      pokemonEntities().filter(p => p.spotId === null)
    ),

    // Pokemon by player
    currentPlayerPokemon: computed(() =>
      pokemonEntities().filter(p => p.playerId === currentPlayerId())
    ),

    currentPlayerBench: computed(() =>
      pokemonEntities().filter(p => p.playerId === currentPlayerId() && p.spotId === null)
    ),

    // Get Pokemon at a specific spot
    getPokemonAtSpot: computed(() => (spotId: string) =>
      pokemonEntities().find(p => p.spotId === spotId)
    ),

    // Get occupied spot IDs by current player
    ownOccupiedSpotIds: computed(() => 
      new Set(pokemonEntities()
        .filter(p => p.spotId !== null && p.playerId === currentPlayerId())
        .map(p => p.spotId!))
    ),

    // Get occupied spot IDs by enemies
    enemyOccupiedSpotIds: computed(() => 
      new Set(pokemonEntities()
        .filter(p => p.spotId !== null && p.playerId !== currentPlayerId())
        .map(p => p.spotId!))
    ),

    // Get all occupied spot IDs (for backward compatibility)
    occupiedSpotIds: computed(() => 
      new Set(pokemonEntities().filter(p => p.spotId !== null).map(p => p.spotId!))
    ),

    // Get player's entry spots
    getPlayerEntrySpots: computed(() => (playerId: number) =>
      spots().filter(s => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === playerId)
    ),

    // Get player's flag spot
    getPlayerFlagSpot: computed(() => (playerId: number) =>
      spots().find(s => s.metadata.type === 'flag' && 'playerId' in s.metadata && s.metadata.playerId === playerId)
    ),

    // Get opponent's flag spot
    getOpponentFlagSpot: computed(() => {
      const current = currentPlayerId();
      const opponent = current === 1 ? 2 : 1;
      return spots().find(s => s.metadata.type === 'flag' && 'playerId' in s.metadata && s.metadata.playerId === opponent);
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
        const flagSpot = store.spots().find(
          s => s.metadata.type === 'flag' && 'playerId' in s.metadata && s.metadata.playerId === playerId
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

      const pokemon = store.pokemonEntities().find(p => p.id === id);
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
              enemyOccupied
            );
            reachableFromEntry.forEach(id => allTargets.add(id));
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
          enemyOccupied
        );
      }

      patchState(store, { selectedPokemonId: id, validMoveTargets: validTargets });
    },

    // Move Pokemon to a spot (includes battle handling and win check)
    movePokemon(pokemonId: string, targetSpotId: string): { success: boolean; battle?: BattleResult; won?: boolean } {
      const pokemon = store.pokemonEntities().find(p => p.id === pokemonId);
      if (!pokemon) return { success: false };

      // Verify it's a valid move
      if (!store.validMoveTargets().includes(targetSpotId)) {
        return { success: false };
      }

      // Check if there's an enemy Pokemon at the target (battle!)
      const defender = store.pokemonEntities().find(
        p => p.spotId === targetSpotId && p.playerId !== pokemon.playerId
      );

      let battleResult: BattleResult | undefined;

      if (defender) {
        // Check if defender is on a flag spot (normal types get bonus)
        const targetSpot = store.spots().find(s => s.id === targetSpotId);
        const defenderOnFlagSpot = targetSpot?.metadata.type === 'flag';
        
        // Execute battle
        battleResult = executeBattle(pokemon, defender, defenderOnFlagSpot);
        patchState(store, { lastBattle: battleResult });

        if (battleResult.winnerId === pokemon.id) {
          // Attacker wins - defender goes back to bench
          patchState(store, 
            updateEntity({ id: defender.id, changes: { spotId: null } }, { collection: 'pokemon' }),
            updateEntity({ id: pokemonId, changes: { spotId: targetSpotId } }, { collection: 'pokemon' })
          );
        } else {
          // Defender wins - attacker goes back to bench
          patchState(store, 
            updateEntity({ id: pokemonId, changes: { spotId: null } }, { collection: 'pokemon' })
          );
        }
      } else {
        // No battle - just move
        patchState(store, 
          updateEntity({ id: pokemonId, changes: { spotId: targetSpotId } }, { collection: 'pokemon' })
        );
      }

      // Check win condition - did the moving Pokemon reach opponent's flag?
      const movedPokemon = store.pokemonEntities().find(p => p.id === pokemonId);
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
      patchState(
        store,
        removeAllEntities({ collection: 'pokemon' }),
        {
          currentPlayerId: 1,
          selectedPokemonId: null,
          validMoveTargets: [],
          phase: 'playing',
          winnerId: null,
          lastBattle: null,
        }
      );
    },
  }))
);

// Export types
export type { BattleResult };
