import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MultiplayerService } from './multiplayer.service';
import { MultiplayerStore } from './multiplayer.store';
import { SignalRService } from './signalr.service';
import { RoomInfo, MultiplayerGameState, MoveResult } from './multiplayer.types';

describe('MultiplayerService', () => {
  let service: MultiplayerService;
  let store: InstanceType<typeof MultiplayerStore>;

  // Capture event handlers registered via signalR.on()
  const eventHandlers = new Map<string, (data: unknown) => void>();

  const mockSignalR = {
    connect: vi.fn(),
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn((eventName: string, handler: (data: unknown) => void) => {
      eventHandlers.set(eventName, handler);
    }),
    off: vi.fn(),
  };

  const baseGameState: MultiplayerGameState = {
    currentPlayerId: 1,
    playerCount: 2,
    selectedPokemonId: null,
    validMoveTargets: [],
    phase: 'playing',
    winnerId: null,
    lastBattle: null,
    spots: [],
    passages: [],
    pokemon: [],
  };

  beforeEach(() => {
    eventHandlers.clear();
    vi.clearAllMocks();
    // Re-attach mock implementation after clearAllMocks
    mockSignalR.on.mockImplementation((eventName: string, handler: (data: unknown) => void) => {
      eventHandlers.set(eventName, handler);
    });

    TestBed.configureTestingModule({
      providers: [
        MultiplayerService,
        MultiplayerStore,
        { provide: SignalRService, useValue: mockSignalR },
      ],
    });

    service = TestBed.inject(MultiplayerService);
    store = TestBed.inject(MultiplayerStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  describe('event handlers', () => {
    it('registers handlers for all SignalR events', () => {
      expect(eventHandlers.has('PlayerJoined')).toBe(true);
      expect(eventHandlers.has('GameStarted')).toBe(true);
      expect(eventHandlers.has('GameStateUpdated')).toBe(true);
      expect(eventHandlers.has('MoveMade')).toBe(true);
      expect(eventHandlers.has('GameEnded')).toBe(true);
      expect(eventHandlers.has('PlayerLeft')).toBe(true);
    });

    it('PlayerJoined updates room info in the store', () => {
      const roomInfo: RoomInfo = {
        roomId: 'ABC1',
        playerCount: 2,
        players: ['p1', 'p2'],
        state: 'waiting',
      };
      eventHandlers.get('PlayerJoined')!(roomInfo);

      expect(store.roomCode()).toBe('ABC1');
      expect(store.opponentConnected()).toBe(true);
    });

    it('GameStarted sets game state and roomState to playing', () => {
      const gameState: MultiplayerGameState = { ...baseGameState };
      eventHandlers.get('GameStarted')!(gameState);

      expect(store.roomState()).toBe('playing');
      expect(store.phase()).toBe('playing');
    });

    it('GameStateUpdated updates the game state', () => {
      const updated: MultiplayerGameState = {
        ...baseGameState,
        currentPlayerId: 2,
        selectedPokemonId: 'some-id',
      };
      eventHandlers.get('GameStateUpdated')!(updated);

      expect(store.currentPlayerId()).toBe(2);
      expect(store.selectedPokemonId()).toBe('some-id');
    });

    it('MoveMade updates game state', () => {
      const moveResult: MoveResult = {
        success: true,
        won: false,
        gameState: { ...baseGameState, currentPlayerId: 2 },
      };
      eventHandlers.get('MoveMade')!(moveResult);

      expect(store.currentPlayerId()).toBe(2);
    });

    it('MoveMade sets roomState to ended when won', () => {
      const moveResult: MoveResult = {
        success: true,
        won: true,
        gameState: { ...baseGameState, phase: 'ended', winnerId: 1 },
      };
      eventHandlers.get('MoveMade')!(moveResult);

      expect(store.roomState()).toBe('ended');
    });

    it('GameEnded sets game state and roomState to ended', () => {
      const endState: MultiplayerGameState = { ...baseGameState, phase: 'ended', winnerId: 2 };
      eventHandlers.get('GameEnded')!(endState);

      expect(store.roomState()).toBe('ended');
      expect(store.winnerId()).toBe(2);
    });

    it('PlayerLeft decrements player count in room info', () => {
      store.setRoomInfo({ roomId: 'XYZ', playerCount: 2, players: ['p1', 'p2'], state: 'playing' });
      eventHandlers.get('PlayerLeft')!('XYZ');

      expect(store.roomInfo()!.playerCount).toBe(1);
    });
  });

  // ==========================================================================
  // createRoom
  // ==========================================================================

  describe('createRoom', () => {
    it('sets roomState to waiting and stores room info on success', async () => {
      const roomInfo: RoomInfo = { roomId: 'NEW1', playerCount: 1, players: ['p1'], state: 'waiting' };
      mockSignalR.connect.mockResolvedValue(true);
      mockSignalR.invoke.mockResolvedValue({ success: true, room: roomInfo, assignedPlayerId: 1 });

      const result = await service.createRoom();

      expect(result).toBe(true);
      expect(store.roomState()).toBe('waiting');
      expect(store.roomCode()).toBe('NEW1');
      expect(store.localPlayerId()).toBe(1);
    });

    it('sets error and idle state when connection fails', async () => {
      mockSignalR.connect.mockResolvedValue(false);

      const result = await service.createRoom();

      expect(result).toBe(false);
      expect(store.roomState()).toBe('idle');
      expect(store.error()).toBeTruthy();
    });

    it('sets error when server returns failure', async () => {
      mockSignalR.connect.mockResolvedValue(true);
      mockSignalR.invoke.mockResolvedValue({ success: false, error: 'Server full' });

      const result = await service.createRoom();

      expect(result).toBe(false);
      expect(store.error()).toBe('Server full');
      expect(store.roomState()).toBe('idle');
    });

    it('sets error on unexpected exception', async () => {
      mockSignalR.connect.mockRejectedValue(new Error('Network error'));

      const result = await service.createRoom();

      expect(result).toBe(false);
      expect(store.error()).toBe('Network error');
    });
  });

  // ==========================================================================
  // joinRoom
  // ==========================================================================

  describe('joinRoom', () => {
    it('sets roomState to waiting and stores room info on success', async () => {
      const roomInfo: RoomInfo = { roomId: 'JOIN', playerCount: 2, players: ['p1', 'p2'], state: 'waiting' };
      mockSignalR.connect.mockResolvedValue(true);
      mockSignalR.invoke.mockResolvedValue({ success: true, room: roomInfo, assignedPlayerId: 2 });

      const result = await service.joinRoom('JOIN');

      expect(result).toBe(true);
      expect(store.localPlayerId()).toBe(2);
      expect(store.roomCode()).toBe('JOIN');
    });

    it('sets roomState to playing when room is already in playing state', async () => {
      const roomInfo: RoomInfo = { roomId: 'LIVE', playerCount: 2, players: ['p1', 'p2'], state: 'playing' };
      mockSignalR.connect.mockResolvedValue(true);
      mockSignalR.invoke.mockResolvedValue({ success: true, room: roomInfo, assignedPlayerId: 2 });

      await service.joinRoom('LIVE');

      expect(store.roomState()).toBe('playing');
    });

    it('sets error and idle state on failure', async () => {
      mockSignalR.connect.mockResolvedValue(true);
      mockSignalR.invoke.mockResolvedValue({ success: false, error: 'Room not found' });

      const result = await service.joinRoom('NOPE');

      expect(result).toBe(false);
      expect(store.error()).toBe('Room not found');
      expect(store.roomState()).toBe('idle');
    });
  });

  // ==========================================================================
  // selectPokemon
  // ==========================================================================

  describe('selectPokemon', () => {
    it('does not send when not my turn', async () => {
      // Default store state: no game state → isMyTurn = false
      await service.selectPokemon('pokemon-1');

      expect(mockSignalR.send).not.toHaveBeenCalled();
    });

    it('sends SelectPokemon when it is my turn', async () => {
      // Set up game state where it's my turn
      store.setLocalPlayerId(1);
      store.setGameState({
        ...baseGameState,
        currentPlayerId: 1,
        phase: 'playing',
      });
      mockSignalR.send.mockResolvedValue(undefined);

      await service.selectPokemon('pokemon-1');

      expect(mockSignalR.send).toHaveBeenCalledWith('SelectPokemon', 'pokemon-1');
    });
  });

  // ==========================================================================
  // movePokemon
  // ==========================================================================

  describe('movePokemon', () => {
    it('does not send when not my turn', async () => {
      await service.movePokemon('pokemon-1', 'spot-1');

      expect(mockSignalR.send).not.toHaveBeenCalled();
    });

    it('sends MovePokemon when it is my turn', async () => {
      store.setLocalPlayerId(1);
      store.setGameState({
        ...baseGameState,
        currentPlayerId: 1,
        phase: 'playing',
      });
      mockSignalR.send.mockResolvedValue(undefined);

      await service.movePokemon('pokemon-1', 'spot-1');

      expect(mockSignalR.send).toHaveBeenCalledWith('MovePokemon', 'pokemon-1', 'spot-1');
    });
  });
});
