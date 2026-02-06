import { Spot, Passage } from '../models/board.models';

/**
 * Result of a battle between two Pokemon
 */
export type BattleResult = {
  attackerId: string;
  defenderId: string;
  attackerRoll: number;
  defenderRoll: number;
  attackerBonus: number;
  defenderBonus: number;
  winnerId: string;
  loserId: string;
};

/**
 * Game state managed by GameStore
 */
export type GameState = {
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

export const initialGameState: GameState = {
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
