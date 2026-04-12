import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MultiplayerStore } from './multiplayer.store';
import { MultiplayerGameState, RoomInfo } from './multiplayer.types';

// ============================================================================
// Helpers
// ============================================================================

const makeRoomInfo = (overrides: Partial<RoomInfo> = {}): RoomInfo => ({
  roomId: 'TEST',
  playerCount: 1,
  players: ['conn1'],
  state: 'waiting',
  ...overrides,
});

const makeGameState = (overrides: Partial<MultiplayerGameState> = {}): MultiplayerGameState => ({
  currentPlayerId: 1,
  playerCount: 2,
  phase: 'playing',
  winnerId: null,
  lastBattle: null,
  selectedPokemonId: null,
  validMoveTargets: [],
  spots: [],
  passages: [],
  pokemon: [],
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('MultiplayerStore', () => {
  let store: InstanceType<typeof MultiplayerStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MultiplayerStore);
    store.reset();
  });

  // ==========================================================================
  // roomCode
  // ==========================================================================

  describe('roomCode', () => {
    it('is null when no roomInfo', () => {
      expect(store.roomCode()).toBeNull();
    });

    it('returns the roomId when roomInfo is set', () => {
      store.setRoomInfo(makeRoomInfo({ roomId: 'ABCD' }));
      expect(store.roomCode()).toBe('ABCD');
    });
  });

  // ==========================================================================
  // isHost
  // ==========================================================================

  describe('isHost', () => {
    it('is false when localPlayerId is null', () => {
      expect(store.isHost()).toBe(false);
    });

    it('is true when localPlayerId is 1', () => {
      store.setLocalPlayerId(1);
      expect(store.isHost()).toBe(true);
    });

    it('is false when localPlayerId is 2', () => {
      store.setLocalPlayerId(2);
      expect(store.isHost()).toBe(false);
    });
  });

  // ==========================================================================
  // opponentConnected
  // ==========================================================================

  describe('opponentConnected', () => {
    it('is false when no roomInfo', () => {
      expect(store.opponentConnected()).toBe(false);
    });

    it('is false when playerCount is 1', () => {
      store.setRoomInfo(makeRoomInfo({ playerCount: 1 }));
      expect(store.opponentConnected()).toBe(false);
    });

    it('is true when playerCount is 2', () => {
      store.setRoomInfo(makeRoomInfo({ playerCount: 2 }));
      expect(store.opponentConnected()).toBe(true);
    });
  });

  // ==========================================================================
  // isLoading
  // ==========================================================================

  describe('isLoading', () => {
    it('is false for idle state', () => {
      store.setRoomState('idle');
      expect(store.isLoading()).toBe(false);
    });

    it('is true for creating state', () => {
      store.setRoomState('creating');
      expect(store.isLoading()).toBe(true);
    });

    it('is true for joining state', () => {
      store.setRoomState('joining');
      expect(store.isLoading()).toBe(true);
    });

    it('is false for waiting state', () => {
      store.setRoomState('waiting');
      expect(store.isLoading()).toBe(false);
    });

    it('is false for playing state', () => {
      store.setRoomState('playing');
      expect(store.isLoading()).toBe(false);
    });
  });

  // ==========================================================================
  // isWaiting
  // ==========================================================================

  describe('isWaiting', () => {
    it('is false for idle', () => {
      expect(store.isWaiting()).toBe(false);
    });

    it('is true for waiting', () => {
      store.setRoomState('waiting');
      expect(store.isWaiting()).toBe(true);
    });

    it('is false for playing', () => {
      store.setRoomState('playing');
      expect(store.isWaiting()).toBe(false);
    });
  });

  // ==========================================================================
  // isInRoom
  // ==========================================================================

  describe('isInRoom', () => {
    it('is false for idle', () => {
      expect(store.isInRoom()).toBe(false);
    });

    it('is true for waiting', () => {
      store.setRoomState('waiting');
      expect(store.isInRoom()).toBe(true);
    });

    it('is true for playing', () => {
      store.setRoomState('playing');
      expect(store.isInRoom()).toBe(true);
    });

    it('is false for ended', () => {
      store.setRoomState('ended');
      expect(store.isInRoom()).toBe(false);
    });
  });

  // ==========================================================================
  // isMyTurn
  // ==========================================================================

  describe('isMyTurn', () => {
    it('is false when gameState is null', () => {
      expect(store.isMyTurn()).toBe(false);
    });

    it('is false when phase is not playing', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ currentPlayerId: 1, phase: 'setup' }));
      expect(store.isMyTurn()).toBe(false);
    });

    it('is false when it is not my turn', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ currentPlayerId: 2, phase: 'playing' }));
      expect(store.isMyTurn()).toBe(false);
    });

    it('is true when currentPlayerId matches localPlayerId and phase is playing', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ currentPlayerId: 1, phase: 'playing' }));
      expect(store.isMyTurn()).toBe(true);
    });
  });

  // ==========================================================================
  // Game state accessors
  // ==========================================================================

  describe('spots', () => {
    it('returns empty array when gameState is null', () => {
      expect(store.spots()).toEqual([]);
    });

    it('returns spots from gameState', () => {
      const spots = [{ id: 's1', x: 0, y: 0, metadata: { type: 'entry', playerId: 1 } } as any];
      store.setGameState(makeGameState({ spots }));
      expect(store.spots()).toHaveLength(1);
    });
  });

  describe('passages', () => {
    it('returns empty array when gameState is null', () => {
      expect(store.passages()).toEqual([]);
    });

    it('returns passages from gameState', () => {
      const passages = [{ id: 'p1', fromSpotId: 'a', toSpotId: 'b' } as any];
      store.setGameState(makeGameState({ passages }));
      expect(store.passages()).toHaveLength(1);
    });
  });

  describe('pokemon', () => {
    it('returns empty array when gameState is null', () => {
      expect(store.pokemon()).toEqual([]);
    });

    it('returns pokemon from gameState', () => {
      const pokemon = [{ id: 'pk1', speciesId: 'snorlax', playerId: 1, spotId: null } as any];
      store.setGameState(makeGameState({ pokemon }));
      expect(store.pokemon()).toHaveLength(1);
    });
  });

  describe('currentPlayerId', () => {
    it('returns 1 (default) when gameState is null', () => {
      expect(store.currentPlayerId()).toBe(1);
    });

    it('returns gameState.currentPlayerId when set', () => {
      store.setGameState(makeGameState({ currentPlayerId: 2 }));
      expect(store.currentPlayerId()).toBe(2);
    });
  });

  describe('selectedPokemonId', () => {
    it('returns null when gameState is null', () => {
      expect(store.selectedPokemonId()).toBeNull();
    });

    it('returns selectedPokemonId from gameState', () => {
      store.setGameState(makeGameState({ selectedPokemonId: 'pk-abc' }));
      expect(store.selectedPokemonId()).toBe('pk-abc');
    });
  });

  describe('validMoveTargets', () => {
    it('returns empty array when gameState is null', () => {
      expect(store.validMoveTargets()).toEqual([]);
    });

    it('returns validMoveTargets from gameState', () => {
      store.setGameState(makeGameState({ validMoveTargets: ['spot1', 'spot2'] }));
      expect(store.validMoveTargets()).toEqual(['spot1', 'spot2']);
    });
  });

  describe('phase', () => {
    it('returns setup (default) when gameState is null', () => {
      expect(store.phase()).toBe('setup');
    });

    it('returns phase from gameState', () => {
      store.setGameState(makeGameState({ phase: 'ended' }));
      expect(store.phase()).toBe('ended');
    });
  });

  describe('winnerId', () => {
    it('returns null when gameState is null', () => {
      expect(store.winnerId()).toBeNull();
    });

    it('returns winnerId from gameState', () => {
      store.setGameState(makeGameState({ winnerId: 2 }));
      expect(store.winnerId()).toBe(2);
    });
  });

  describe('lastBattle', () => {
    it('returns null when gameState is null', () => {
      expect(store.lastBattle()).toBeNull();
    });

    it('returns lastBattle from gameState', () => {
      const battle = { attackerId: 'a', defenderId: 'b', attackerRoll: 5, defenderRoll: 2, attackerBonus: 0, defenderBonus: 0, winnerId: 'a', loserId: 'b' } as any;
      store.setGameState(makeGameState({ lastBattle: battle }));
      expect(store.lastBattle()).toEqual(battle);
    });
  });

  // ==========================================================================
  // Methods
  // ==========================================================================

  describe('setRoomState', () => {
    it('updates roomState', () => {
      store.setRoomState('creating');
      expect(store.isLoading()).toBe(true);
    });
  });

  describe('setRoomInfo', () => {
    it('sets roomInfo', () => {
      store.setRoomInfo(makeRoomInfo({ roomId: 'XY12' }));
      expect(store.roomCode()).toBe('XY12');
    });

    it('clears roomInfo when null', () => {
      store.setRoomInfo(makeRoomInfo());
      store.setRoomInfo(null);
      expect(store.roomCode()).toBeNull();
    });
  });

  describe('setLocalPlayerId', () => {
    it('updates localPlayerId', () => {
      store.setLocalPlayerId(2);
      expect(store.isHost()).toBe(false);
    });

    it('clears localPlayerId when null', () => {
      store.setLocalPlayerId(1);
      store.setLocalPlayerId(null);
      expect(store.isHost()).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error', () => {
      store.setError('Connection failed');
      expect(store.error()).toBe('Connection failed');
    });

    it('clears error when null', () => {
      store.setError('some error');
      store.setError(null);
      expect(store.error()).toBeNull();
    });
  });

  describe('setGameState', () => {
    it('sets gameState', () => {
      store.setGameState(makeGameState({ currentPlayerId: 2 }));
      expect(store.currentPlayerId()).toBe(2);
    });

    it('clears gameState when null', () => {
      store.setGameState(makeGameState({ currentPlayerId: 2 }));
      store.setGameState(null);
      expect(store.currentPlayerId()).toBe(1); // defaults to 1
    });
  });

  describe('playerLeft', () => {
    it('decrements playerCount by 1 when roomInfo is set', () => {
      store.setRoomInfo(makeRoomInfo({ playerCount: 2 }));
      store.playerLeft();
      expect(store.opponentConnected()).toBe(false); // playerCount becomes 1
    });

    it('does nothing when roomInfo is null', () => {
      // Should not throw
      expect(() => store.playerLeft()).not.toThrow();
      expect(store.roomCode()).toBeNull();
    });
  });

  describe('reset', () => {
    it('restores all state to initial values', () => {
      store.setRoomState('playing');
      store.setRoomInfo(makeRoomInfo());
      store.setLocalPlayerId(2);
      store.setError('some error');
      store.setGameState(makeGameState());

      store.reset();

      expect(store.roomState()).toBe('idle');
      expect(store.roomCode()).toBeNull();
      expect(store.localPlayerId()).toBeNull();
      expect(store.error()).toBeNull();
      expect(store.currentPlayerId()).toBe(1);
    });
  });
});
