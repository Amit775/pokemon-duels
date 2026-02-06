import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState, type } from '@ngrx/signals';
import {
  withEntities,
  addEntity,
  removeEntity,
  updateEntity,
  setAllEntities,
} from '@ngrx/signals/entities';
import { Pokemon, Spot, Passage, POKEMON_SPECIES, createPokemon, getSpecies } from '../models/board.models';

// ============================================================================
// State Types
// ============================================================================

type GameState = {
  /** Current player's turn (1-4) */
  currentPlayerId: number;
  /** Number of players in the game */
  playerCount: number;
  /** Currently selected Pokemon ID */
  selectedPokemonId: string | null;
  /** Spot IDs that the selected Pokemon can move to */
  validMoveTargets: string[];
  /** Game phase */
  phase: 'setup' | 'playing' | 'ended';
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
  spots: [],
  passages: [],
};

// ============================================================================
// Movement Calculation
// ============================================================================

/**
 * Find all spots reachable within N moves using BFS
 */
function findReachableSpots(
  startSpotId: string,
  maxMoves: number,
  spots: Spot[],
  passages: Passage[],
  occupiedSpotIds: Set<string>
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

    if (distance > 0 && !occupiedSpotIds.has(spotId)) {
      reachable.push(spotId);
    }

    if (distance < maxMoves) {
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

    // Get occupied spot IDs
    occupiedSpotIds: computed(() => 
      new Set(pokemonEntities().filter(p => p.spotId !== null).map(p => p.spotId!))
    ),

    // Get player's entry spots
    getPlayerEntrySpots: computed(() => (playerId: number) =>
      spots().filter(s => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === playerId)
    ),
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
      const speciesIds = ['snorlax', 'venusaur', 'blastoise', 'charizard'];
      
      // Give each player one of each Pokemon
      for (let playerId = 1; playerId <= store.playerCount(); playerId++) {
        for (const speciesId of speciesIds) {
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
      if (!id) {
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

      if (pokemon.spotId === null) {
        // Pokemon is on bench - can move to unoccupied entry spots
        const entrySpots = store.getPlayerEntrySpots()(pokemon.playerId);
        const occupied = store.occupiedSpotIds();
        validTargets = entrySpots
          .filter(s => !occupied.has(s.id))
          .map(s => s.id);
      } else {
        // Pokemon is on board - calculate reachable spots
        validTargets = findReachableSpots(
          pokemon.spotId,
          species.movement,
          store.spots(),
          store.passages(),
          store.occupiedSpotIds()
        );
      }

      patchState(store, { selectedPokemonId: id, validMoveTargets: validTargets });
    },

    // Move Pokemon to a spot
    movePokemon(pokemonId: string, targetSpotId: string): boolean {
      const pokemon = store.pokemonEntities().find(p => p.id === pokemonId);
      if (!pokemon) return false;

      // Verify it's a valid move
      if (!store.validMoveTargets().includes(targetSpotId)) {
        return false;
      }

      // Update Pokemon position
      patchState(store, 
        updateEntity({ id: pokemonId, changes: { spotId: targetSpotId } }, { collection: 'pokemon' })
      );

      // Clear selection and end turn
      patchState(store, { 
        selectedPokemonId: null, 
        validMoveTargets: [],
      });

      return true;
    },

    // End current player's turn
    endTurn(): void {
      const nextPlayer = (store.currentPlayerId() % store.playerCount()) + 1;
      patchState(store, { 
        currentPlayerId: nextPlayer,
        selectedPokemonId: null,
        validMoveTargets: [],
      });
    },

    // Clear selection
    clearSelection(): void {
      patchState(store, { selectedPokemonId: null, validMoveTargets: [] });
    },

    // Reset game
    resetGame(): void {
      patchState(store, {
        ...initialGameState,
        spots: store.spots(),
        passages: store.passages(),
      });
    },
  }))
);
