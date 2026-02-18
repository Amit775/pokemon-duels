import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Spot, Passage, Pokemon } from '../models/board.models';
import { BattleResult } from '../store/game.types';

// Types matching server models
export type RoomInfo = {
  roomId: string;
  playerCount: number;
  players: string[];
  state: 'waiting' | 'playing' | 'ended';
};

export type JoinResult = {
  success: boolean;
  error?: string;
  room?: RoomInfo;
  assignedPlayerId?: number;
};

export type MultiplayerGameState = {
  currentPlayerId: number;
  playerCount: number;
  selectedPokemonId: string | null;
  validMoveTargets: string[];
  phase: 'setup' | 'playing' | 'ended';
  winnerId: number | null;
  lastBattle: BattleResult | null;
  spots: Spot[];
  passages: Passage[];
  pokemon: Pokemon[];
};

export type MoveResult = {
  success: boolean;
  battle?: BattleResult;
  won: boolean;
  gameState: MultiplayerGameState;
};

export type RoomState = 'idle' | 'creating' | 'joining' | 'waiting' | 'playing' | 'ended';

/**
 * Service for multiplayer game management
 */
@Injectable({
  providedIn: 'root'
})
export class MultiplayerService implements OnDestroy {
  private readonly signalR = inject(SignalRService);
  
  // Room state
  private readonly _roomState = signal<RoomState>('idle');
  private readonly _roomInfo = signal<RoomInfo | null>(null);
  private readonly _localPlayerId = signal<number | null>(null);
  private readonly _error = signal<string | null>(null);
  
  // Game state from server
  private readonly _gameState = signal<MultiplayerGameState | null>(null);
  
  // Public readonly signals
  readonly roomState = this._roomState.asReadonly();
  readonly roomInfo = this._roomInfo.asReadonly();
  readonly localPlayerId = this._localPlayerId.asReadonly();
  readonly error = this._error.asReadonly();
  readonly gameState = this._gameState.asReadonly();
  
  // Computed values for UI
  readonly roomCode = computed(() => this._roomInfo()?.roomId ?? null);
  readonly isMyTurn = computed(() => {
    const state = this._gameState();
    const myId = this._localPlayerId();
    return state?.currentPlayerId === myId && state?.phase === 'playing';
  });
  readonly isHost = computed(() => this._localPlayerId() === 1);
  readonly opponentConnected = computed(() => (this._roomInfo()?.playerCount ?? 0) >= 2);
  
  // Game state accessors
  readonly spots = computed(() => this._gameState()?.spots ?? []);
  readonly passages = computed(() => this._gameState()?.passages ?? []);
  readonly pokemon = computed(() => this._gameState()?.pokemon ?? []);
  readonly currentPlayerId = computed(() => this._gameState()?.currentPlayerId ?? 1);
  readonly selectedPokemonId = computed(() => this._gameState()?.selectedPokemonId ?? null);
  readonly validMoveTargets = computed(() => this._gameState()?.validMoveTargets ?? []);
  readonly phase = computed(() => this._gameState()?.phase ?? 'setup');
  readonly winnerId = computed(() => this._gameState()?.winnerId ?? null);
  readonly lastBattle = computed(() => this._gameState()?.lastBattle ?? null);
  
  constructor() {
    this.setupEventHandlers();
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }

  private setupEventHandlers(): void {
    // Player joined the room
    this.signalR.on<RoomInfo>('PlayerJoined', (room) => {
      console.log('Player joined:', room);
      this._roomInfo.set(room);
    });

    // Game started
    this.signalR.on<MultiplayerGameState>('GameStarted', (state) => {
      console.log('Game started:', state);
      this._gameState.set(state);
      this._roomState.set('playing');
    });

    // Game state updated (selection changed, etc.)
    this.signalR.on<MultiplayerGameState>('GameStateUpdated', (state) => {
      console.log('Game state updated:', state);
      this._gameState.set(state);
    });

    // Move was made
    this.signalR.on<MoveResult>('MoveMade', (result) => {
      console.log('Move made:', result);
      this._gameState.set(result.gameState);
      if (result.won) {
        this._roomState.set('ended');
      }
    });

    // Game ended
    this.signalR.on<MultiplayerGameState>('GameEnded', (state) => {
      console.log('Game ended:', state);
      this._gameState.set(state);
      this._roomState.set('ended');
    });

    // Player left
    this.signalR.on<string>('PlayerLeft', (roomId) => {
      console.log('Player left room:', roomId);
      const currentRoom = this._roomInfo();
      if (currentRoom) {
        this._roomInfo.set({
          ...currentRoom,
          playerCount: currentRoom.playerCount - 1
        });
      }
    });
  }

  /**
   * Create a new game room
   */
  async createRoom(): Promise<boolean> {
    try {
      this._error.set(null);
      this._roomState.set('creating');

      // Ensure connected
      const connected = await this.signalR.connect();
      if (!connected) {
        throw new Error('Failed to connect to server');
      }

      const result = await this.signalR.invoke<JoinResult>('CreateRoom');
      
      if (result.success && result.room) {
        this._roomInfo.set(result.room);
        this._localPlayerId.set(result.assignedPlayerId ?? null);
        this._roomState.set('waiting');
        console.log('Room created:', result.room.roomId);
        return true;
      } else {
        throw new Error(result.error ?? 'Failed to create room');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      this._error.set(message);
      this._roomState.set('idle');
      console.error('Create room error:', err);
      return false;
    }
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode: string): Promise<boolean> {
    try {
      this._error.set(null);
      this._roomState.set('joining');

      // Ensure connected
      const connected = await this.signalR.connect();
      if (!connected) {
        throw new Error('Failed to connect to server');
      }

      const result = await this.signalR.invoke<JoinResult>('JoinRoom', roomCode);
      
      if (result.success && result.room) {
        this._roomInfo.set(result.room);
        this._localPlayerId.set(result.assignedPlayerId ?? null);
        
        // Check if game already started
        if (result.room.state === 'playing') {
          this._roomState.set('playing');
        } else {
          this._roomState.set('waiting');
        }
        
        console.log('Joined room:', result.room.roomId, 'as player', result.assignedPlayerId);
        return true;
      } else {
        throw new Error(result.error ?? 'Failed to join room');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      this._error.set(message);
      this._roomState.set('idle');
      console.error('Join room error:', err);
      return false;
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    try {
      if (this._roomInfo()) {
        await this.signalR.invoke('LeaveRoom');
      }
    } catch (err) {
      console.error('Leave room error:', err);
    } finally {
      this._roomInfo.set(null);
      this._localPlayerId.set(null);
      this._gameState.set(null);
      this._roomState.set('idle');
      this._error.set(null);
    }
  }

  /**
   * Select a Pokemon (only works on your turn)
   */
  async selectPokemon(pokemonId: string | null): Promise<void> {
    if (!this.isMyTurn()) {
      console.warn('Not your turn');
      return;
    }

    try {
      await this.signalR.send('SelectPokemon', pokemonId);
    } catch (err) {
      console.error('Select Pokemon error:', err);
    }
  }

  /**
   * Move a Pokemon to a target spot
   */
  async movePokemon(pokemonId: string, targetSpotId: string): Promise<void> {
    if (!this.isMyTurn()) {
      console.warn('Not your turn');
      return;
    }

    try {
      await this.signalR.send('MovePokemon', pokemonId, targetSpotId);
    } catch (err) {
      console.error('Move Pokemon error:', err);
    }
  }

  /**
   * Get Pokemon at a specific spot
   */
  getPokemonAtSpot(spotId: string): Pokemon | undefined {
    return this.pokemon().find(p => p.spotId === spotId);
  }

  /**
   * Get Pokemon on bench for a player
   */
  getBenchPokemon(playerId: number): Pokemon[] {
    return this.pokemon().filter(p => p.playerId === playerId && p.spotId === null);
  }

  /**
   * Get Pokemon on board
   */
  getPokemonOnBoard(): Pokemon[] {
    return this.pokemon().filter(p => p.spotId !== null);
  }
}
