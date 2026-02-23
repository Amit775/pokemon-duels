import { Injectable, inject, OnDestroy } from '@angular/core';
import { SignalRService } from './signalr.service';
import { GameStore } from '../store/game.store';
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
  providedIn: 'root',
})
  private readonly signalR = inject(SignalRService);
  private readonly gameStore = inject(GameStore);

  constructor() {
    this.setupEventHandlers();
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }

  private setupEventHandlers(): void {
    // Sync server events into the game store
    this.signalR.on<MultiplayerGameState>('GameStarted', (state) => {
      this.gameStore.initializeGame(state.spots, state.passages, state.playerCount);
      // Additional state sync if needed
    });
    this.signalR.on<MultiplayerGameState>('GameStateUpdated', (state) => {
      // Sync state into store (custom logic may be needed)
      this.gameStore.patchState({
        ...state,
      });
    });
    this.signalR.on<MoveResult>('MoveMade', (result) => {
      this.gameStore.patchState({
        ...result.gameState,
        lastBattle: result.battle ?? null,
      });
    });
    this.signalR.on<MultiplayerGameState>('GameEnded', (state) => {
      this.gameStore.patchState({
        ...state,
        phase: 'ended',
      });
    });
    // Add more event handlers as needed
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

        // Check if game already started - don't regress from 'playing' to 'waiting'
        // (GameStarted event may have already fired before invoke resolved)
        if (result.room.state === 'playing' || this._roomState() === 'playing') {
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
    // Always dispatch to server, let store update from server event
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
    // Always dispatch to server, let store update from server event
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
    return this.pokemon().find((p) => p.spotId === spotId);
  }

  /**
   * Get Pokemon on bench for a player
   */
  getBenchPokemon(playerId: number): Pokemon[] {
    return this.pokemon().filter((p) => p.playerId === playerId && p.spotId === null);
  }

  /**
   * Get Pokemon on board
   */
  getPokemonOnBoard(): Pokemon[] {
    return this.pokemon().filter((p) => p.spotId !== null);
  }
}
