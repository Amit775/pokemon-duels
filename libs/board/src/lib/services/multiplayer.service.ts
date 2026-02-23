import { Injectable, inject, OnDestroy } from '@angular/core';
import { SignalRService } from './signalr.service';
import { MultiplayerStore } from '../store/multiplayer.store';
import { RoomInfo, JoinResult, MultiplayerGameState, MoveResult } from '../store/multiplayer.types';

/**
 * Thin communication layer for multiplayer game actions.
 * All state lives in MultiplayerStore — this service only handles
 * SignalR communication and dispatches state changes to the store.
 */
@Injectable({
  providedIn: 'root',
})
export class MultiplayerService implements OnDestroy {
  private readonly signalR = inject(SignalRService);
  private readonly store = inject(MultiplayerStore);

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
      this.store.setRoomInfo(room);
    });

    // Game started
    this.signalR.on<MultiplayerGameState>('GameStarted', (state) => {
      console.log('Game started:', state);
      this.store.setGameState(state);
      this.store.setRoomState('playing');
    });

    // Game state updated (selection changed, etc.)
    this.signalR.on<MultiplayerGameState>('GameStateUpdated', (state) => {
      console.log('Game state updated:', state);
      this.store.setGameState(state);
    });

    // Move was made
    this.signalR.on<MoveResult>('MoveMade', (result) => {
      console.log('Move made:', result);
      this.store.setGameState(result.gameState);
      if (result.won) {
        this.store.setRoomState('ended');
      }
    });

    // Game ended
    this.signalR.on<MultiplayerGameState>('GameEnded', (state) => {
      console.log('Game ended:', state);
      this.store.setGameState(state);
      this.store.setRoomState('ended');
    });

    // Player left
    this.signalR.on<string>('PlayerLeft', (roomId) => {
      console.log('Player left room:', roomId);
      this.store.playerLeft();
    });
  }

  /**
   * Create a new game room
   */
  async createRoom(): Promise<boolean> {
    try {
      this.store.setError(null);
      this.store.setRoomState('creating');

      const connected = await this.signalR.connect();
      if (!connected) {
        throw new Error('Failed to connect to server');
      }

      const result = await this.signalR.invoke<JoinResult>('CreateRoom');

      if (result.success && result.room) {
        this.store.setRoomInfo(result.room);
        this.store.setLocalPlayerId(result.assignedPlayerId ?? null);
        this.store.setRoomState('waiting');
        console.log('Room created:', result.room.roomId);
        return true;
      } else {
        throw new Error(result.error ?? 'Failed to create room');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      this.store.setError(message);
      this.store.setRoomState('idle');
      console.error('Create room error:', err);
      return false;
    }
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode: string): Promise<boolean> {
    try {
      this.store.setError(null);
      this.store.setRoomState('joining');

      const connected = await this.signalR.connect();
      if (!connected) {
        throw new Error('Failed to connect to server');
      }

      const result = await this.signalR.invoke<JoinResult>('JoinRoom', roomCode);

      if (result.success && result.room) {
        this.store.setRoomInfo(result.room);
        this.store.setLocalPlayerId(result.assignedPlayerId ?? null);

        // Check if game already started - don't regress from 'playing' to 'waiting'
        // (GameStarted event may have already fired before invoke resolved)
        if (result.room.state === 'playing' || this.store.roomState() === 'playing') {
          this.store.setRoomState('playing');
        } else {
          this.store.setRoomState('waiting');
        }

        console.log('Joined room:', result.room.roomId, 'as player', result.assignedPlayerId);
        return true;
      } else {
        throw new Error(result.error ?? 'Failed to join room');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      this.store.setError(message);
      this.store.setRoomState('idle');
      console.error('Join room error:', err);
      return false;
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    try {
      if (this.store.roomInfo()) {
        await this.signalR.invoke('LeaveRoom');
      }
    } catch (err) {
      console.error('Leave room error:', err);
    } finally {
      this.store.reset();
    }
  }

  /**
   * Select a Pokemon (only works on your turn)
   */
  async selectPokemon(pokemonId: string | null): Promise<void> {
    if (!this.store.isMyTurn()) {
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
    if (!this.store.isMyTurn()) {
      console.warn('Not your turn');
      return;
    }

    try {
      await this.signalR.send('MovePokemon', pokemonId, targetSpotId);
    } catch (err) {
      console.error('Move Pokemon error:', err);
    }
  }
}
