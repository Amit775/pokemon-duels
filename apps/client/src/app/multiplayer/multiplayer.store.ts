import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import {
  MultiplayerStoreState,
  MultiplayerGameState,
  RoomInfo,
  RoomState,
  initialMultiplayerState,
} from './multiplayer.types';

// ============================================================================
// Store Definition
// ============================================================================

export const MultiplayerStore = signalStore(
  { providedIn: 'root' },

  // State
  withState<MultiplayerStoreState>(initialMultiplayerState),

  // Computed signals
  withComputed(({ roomInfo, localPlayerId, gameState, roomState }) => ({
    // Room accessors
    roomCode: computed(() => roomInfo()?.roomId ?? null),
    isHost: computed(() => localPlayerId() === 1),
    opponentConnected: computed(() => (roomInfo()?.playerCount ?? 0) >= 2),

    // Room UI helpers
    isLoading: computed(() => {
      const state = roomState();
      return state === 'creating' || state === 'joining';
    }),
    isWaiting: computed(() => roomState() === 'waiting'),
    isInRoom: computed(() => {
      const state = roomState();
      return state === 'waiting' || state === 'playing';
    }),

    // Turn
    isMyTurn: computed(() => {
      const state = gameState();
      const myId = localPlayerId();
      return state?.currentPlayerId === myId && state?.phase === 'playing';
    }),

    // Game state accessors
    spots: computed(() => gameState()?.spots ?? []),
    passages: computed(() => gameState()?.passages ?? []),
    pokemon: computed(() => gameState()?.pokemon ?? []),
    currentPlayerId: computed(() => gameState()?.currentPlayerId ?? 1),
    selectedPokemonId: computed(() => gameState()?.selectedPokemonId ?? null),
    validMoveTargets: computed(() => gameState()?.validMoveTargets ?? []),
    phase: computed(() => gameState()?.phase ?? 'setup'),
    winnerId: computed(() => gameState()?.winnerId ?? null),
    lastBattle: computed(() => gameState()?.lastBattle ?? null),
  })),

  // Methods for state mutations
  withMethods((store) => ({
    setRoomState(state: RoomState): void {
      patchState(store, { roomState: state });
    },

    setRoomInfo(info: RoomInfo | null): void {
      patchState(store, { roomInfo: info });
    },

    setLocalPlayerId(id: number | null): void {
      patchState(store, { localPlayerId: id });
    },

    setError(error: string | null): void {
      patchState(store, { error });
    },

    setGameState(state: MultiplayerGameState | null): void {
      patchState(store, { gameState: state });
    },

    playerLeft(): void {
      const currentRoom = store.roomInfo();
      if (currentRoom) {
        patchState(store, {
          roomInfo: {
            ...currentRoom,
            playerCount: currentRoom.playerCount - 1,
          },
        });
      }
    },

    reset(): void {
      patchState(store, initialMultiplayerState);
    },
  })),
);
