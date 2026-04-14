import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState, type } from '@ngrx/signals';
import {
  withEntities,
  addEntity,
  removeEntity,
  updateEntity,
  removeEntities,
  removeAllEntities,
} from '@ngrx/signals/entities';
import { Spot, Passage, EditingMode, SpotType, PassageType } from '../models/board.models';
import {
  BeautifyOptions,
  initBeautify,
  runFRStep,
  coolTemperature,
  applyPositions,
} from '../utils/beautify.utils';
import { snapToGrid } from '../utils/grid.utils';

// ============================================================================
// State Types
// ============================================================================

type BoardUIState = {
  selectedSpotId: string | null;
  selectedPassageId: string | null;
  passageSourceSpotId: string | null;
  editingMode: EditingMode;
  gridSnapEnabled: boolean;
  /** Spot type to use when creating new spots */
  newSpotType: SpotType;
  /** Player ID to use when creating entry/flag spots */
  newSpotPlayerId: number;
  /** Passage type to use when creating new passages */
  newPassageType: PassageType;
  /** True while an animated beautify pass is running */
  isBeautifying: boolean;
  /** Whether beautify should animate step-by-step (vs instant) */
  beautifyAnimated: boolean;
};

const initialUIState: BoardUIState = {
  selectedSpotId: null,
  selectedPassageId: null,
  passageSourceSpotId: null,
  editingMode: 'select',
  gridSnapEnabled: true,
  newSpotType: 'normal',
  newSpotPlayerId: 1,
  newPassageType: 'normal',
  isBeautifying: false,
  beautifyAnimated: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a passage already exists between two spots (in either direction)
 */
function passageExists(passages: Passage[], fromId: string, toId: string): boolean {
  return passages.some(
    (p) =>
      (p.fromSpotId === fromId && p.toSpotId === toId) ||
      (p.fromSpotId === toId && p.toSpotId === fromId),
  );
}

/**
 * Check if all spots are connected using BFS/Union-Find
 */
function areAllSpotsConnected(spots: Spot[], passages: Passage[]): boolean {
  if (spots.length <= 1) return true;

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  for (const spot of spots) {
    adjacency.set(spot.id, new Set());
  }
  for (const passage of passages) {
    adjacency.get(passage.fromSpotId)?.add(passage.toSpotId);
    adjacency.get(passage.toSpotId)?.add(passage.fromSpotId);
  }

  // BFS from first spot
  const visited = new Set<string>();
  const queue = [spots[0].id];
  visited.add(spots[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === spots.length;
}

// ============================================================================
// Store Definition
// ============================================================================

export const BoardStore = signalStore(
  // UI State
  withState(initialUIState),

  // Entity collections
  withEntities({ entity: type<Spot>(), collection: 'spot' }),
  withEntities({ entity: type<Passage>(), collection: 'passage' }),

  // Computed values
  withComputed(
    ({
      spotEntities,
      spotEntityMap,
      passageEntities,
      passageEntityMap,
      selectedSpotId,
      selectedPassageId,
    }) => ({
      // Count helpers
      spotCount: computed(() => spotEntities().length),
      passageCount: computed(() => passageEntities().length),

      // Selected entities - use entityMap for O(1) lookup
      selectedSpot: computed(() => {
        const id = selectedSpotId();
        return id ? spotEntityMap()[id] : undefined;
      }),
      selectedPassage: computed(() => {
        const id = selectedPassageId();
        return id ? passageEntityMap()[id] : undefined;
      }),

      // Validation
      allSpotsConnected: computed(() => areAllSpotsConnected(spotEntities(), passageEntities())),

      isolatedSpots: computed(() => {
        const spots = spotEntities();
        const passages = passageEntities();

        if (spots.length <= 1) return [];

        // Build set of connected spot IDs
        const connectedIds = new Set<string>();
        for (const passage of passages) {
          connectedIds.add(passage.fromSpotId);
          connectedIds.add(passage.toSpotId);
        }

        // Check if we have multiple components
        if (!areAllSpotsConnected(spots, passages)) {
          // Return spots that are either not in any passage OR in disconnected component
          // For simplicity, return spots not in any passage
          return spots.filter((s) => !connectedIds.has(s.id));
        }

        return [];
      }),
    }),
  ),

  // Methods
  withMethods((store) => {
    // Animation frame ID lives outside of state so it never triggers re-renders
    let animFrameId: number | null = null;

    function stopBeautify(): void {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      patchState(store, { isBeautifying: false });
    }

    return {
      // Spot operations
      addSpot(spot: Spot): void {
        patchState(store, addEntity(spot, { collection: 'spot' }));
      },

      updateSpot(id: string, changes: Partial<Spot>): void {
        patchState(store, updateEntity({ id, changes }, { collection: 'spot' }));
      },

      deleteSpot(id: string): void {
        // Remove connected passages first
        const passagesToRemove = store
          .passageEntities()
          .filter((p) => p.fromSpotId === id || p.toSpotId === id)
          .map((p) => p.id);

        patchState(
          store,
          removeEntities(passagesToRemove, { collection: 'passage' }),
          removeEntity(id, { collection: 'spot' }),
          store.selectedSpotId() === id ? { selectedSpotId: null } : {},
        );
      },

      selectSpot(id: string | null): void {
        patchState(store, {
          selectedSpotId: id,
          selectedPassageId: null,
        });
      },

      // Passage operations
      addPassage(passage: Passage): void {
        const spots = store.spotEntities();
        const passages = store.passageEntities();

        const fromExists = spots.some((s) => s.id === passage.fromSpotId);
        const toExists = spots.some((s) => s.id === passage.toSpotId);
        if (!fromExists || !toExists) return;

        if (passageExists(passages, passage.fromSpotId, passage.toSpotId)) return;

        patchState(store, addEntity(passage, { collection: 'passage' }));
      },

      updatePassage(id: string, changes: Partial<Passage>): void {
        patchState(store, updateEntity({ id, changes }, { collection: 'passage' }));
      },

      deletePassage(id: string): void {
        patchState(
          store,
          removeEntity(id, { collection: 'passage' }),
          store.selectedPassageId() === id ? { selectedPassageId: null } : {},
        );
      },

      selectPassage(id: string | null): void {
        patchState(store, {
          selectedPassageId: id,
          selectedSpotId: null,
        });
      },

      // Passage creation helpers
      setPassageSource(id: string | null): void {
        patchState(store, { passageSourceSpotId: id });
      },

      // Get passages for a specific spot
      passagesForSpot(spotId: string): Passage[] {
        return store
          .passageEntities()
          .filter((p) => p.fromSpotId === spotId || p.toSpotId === spotId);
      },

      // Check if a spot has any connections
      isSpotConnected(spotId: string): boolean {
        const spots = store.spotEntities();
        const passages = store.passageEntities();

        if (spots.length === 1) return true;

        return passages.some((p) => p.fromSpotId === spotId || p.toSpotId === spotId);
      },

      // UI state
      setEditingMode(mode: EditingMode): void {
        patchState(store, {
          editingMode: mode,
          passageSourceSpotId: null,
        });
      },

      toggleGridSnap(): void {
        patchState(store, { gridSnapEnabled: !store.gridSnapEnabled() });
      },

      setNewSpotType(type: SpotType): void {
        patchState(store, { newSpotType: type });
      },

      setNewSpotPlayerId(playerId: number): void {
        patchState(store, { newSpotPlayerId: playerId });
      },

      setNewPassageType(type: PassageType): void {
        patchState(store, { newPassageType: type });
      },

      // Reset
      reset(): void {
        stopBeautify();
        patchState(
          store,
          removeAllEntities({ collection: 'spot' }),
          removeAllEntities({ collection: 'passage' }),
          initialUIState,
        );
      },

      // ======================================================================
      // Beautify
      // ======================================================================

      stopBeautify,

      toggleBeautifyAnimation(): void {
        patchState(store, { beautifyAnimated: !store.beautifyAnimated() });
      },

      /**
       * Beautify the current board.
       *
       * When `beautifyAnimated` is true, runs the algorithm step-by-step using
       * requestAnimationFrame so the board visually morphs into the new layout.
       * When false, applies all iterations instantly in a single synchronous pass.
       *
       * Entry spots are pre-positioned near their bench edges before the
       * force-directed algorithm begins. Flag spots are pinned in place.
       */
      beautify(options?: BeautifyOptions): void {
        stopBeautify(); // Cancel any in-progress animation

        const spots = store.spotEntities();
        const passages = store.passageEntities();
        if (spots.length === 0) return;

        const board = { id: '', name: '', spots, passages };
        const gridCellSize = 50;
        const opts: BeautifyOptions = {
          gridSnap: store.gridSnapEnabled(),
          gridCellSize,
          ...options,
        };

        const state = initBeautify(board, opts);
        const { iterations, stepsPerFrame } = state.opts;

        // Apply pre-positioned entry spots immediately so they "snap" to the
        // bench edge before the animation begins.
        for (const id of state.fixed) {
          const p = state.positions.get(id)!;
          patchState(
            store,
            updateEntity(
              { id, changes: { x: Math.round(p.x), y: Math.round(p.y) } },
              { collection: 'spot' },
            ),
          );
        }

        if (!store.beautifyAnimated()) {
          // --- Instant path ---
          for (let iter = 0; iter < iterations; iter++) {
            runFRStep(spots, passages, state);
            coolTemperature(state, iter);
          }
          const result = applyPositions(board, state);
          for (const spot of result.spots) {
            if (state.fixed.has(spot.id)) continue; // already applied above
            patchState(
              store,
              updateEntity(
                { id: spot.id, changes: { x: spot.x, y: spot.y } },
                { collection: 'spot' },
              ),
            );
          }
          return;
        }

        // --- Animated path ---
        patchState(store, { isBeautifying: true });
        let iter = 0;

        function frame(): void {
          const batchEnd = Math.min(iter + stepsPerFrame, iterations);
          while (iter < batchEnd) {
            runFRStep(spots, passages, state);
            coolTemperature(state, iter);
            iter++;
          }

          // Push current positions for all free spots into the store
          for (const spot of spots) {
            if (state.fixed.has(spot.id)) continue;
            const p = state.positions.get(spot.id)!;
            patchState(
              store,
              updateEntity(
                { id: spot.id, changes: { x: Math.round(p.x), y: Math.round(p.y) } },
                { collection: 'spot' },
              ),
            );
          }

          if (iter < iterations) {
            animFrameId = requestAnimationFrame(frame);
            return;
          }

          // Final frame: apply grid snap if enabled
          if (state.opts.gridSnap) {
            for (const spot of spots) {
              if (state.fixed.has(spot.id)) continue;
              const p = state.positions.get(spot.id)!;
              patchState(
                store,
                updateEntity(
                  {
                    id: spot.id,
                    changes: {
                      x: snapToGrid(Math.round(p.x), state.opts.gridCellSize),
                      y: snapToGrid(Math.round(p.y), state.opts.gridCellSize),
                    },
                  },
                  { collection: 'spot' },
                ),
              );
            }
          }

          animFrameId = null;
          patchState(store, { isBeautifying: false });
        }

        animFrameId = requestAnimationFrame(frame);
      },
    };
  }),
);
