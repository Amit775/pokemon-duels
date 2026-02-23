import { Spot, Passage, Pokemon } from '../models/board.models';
import { BattleResult } from './game.types';

// ============================================================================
// Server DTOs
// ============================================================================

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

// ============================================================================
// Store State
// ============================================================================

export type RoomState = 'idle' | 'creating' | 'joining' | 'waiting' | 'playing' | 'ended';

export type MultiplayerStoreState = {
  roomState: RoomState;
  roomInfo: RoomInfo | null;
  localPlayerId: number | null;
  error: string | null;
  gameState: MultiplayerGameState | null;
};

export const initialMultiplayerState: MultiplayerStoreState = {
  roomState: 'idle',
  roomInfo: null,
  localPlayerId: null,
  error: null,
  gameState: null,
};
