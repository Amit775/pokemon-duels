/**
 * Board Domain Models
 *
 * Core types for the game board system.
 * Uses discriminated unions for type-safe spot metadata.
 */

// ============================================================================
// Spot Types
// ============================================================================

/**
 * Discriminated union for spot metadata.
 * Each spot type can have different properties.
 */
export type SpotMetadata =
  | { type: 'normal' }
  | { type: 'entry'; playerId: number }
  | { type: 'flag'; playerId: number };

/**
 * Extract the type string from SpotMetadata
 */
export type SpotType = SpotMetadata['type'];

/**
 * A spot on the game board.
 * Spots are connected via passages.
 */
export type Spot = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** X coordinate (pixels from left) */
  x: number;
  /** Y coordinate (pixels from top) */
  y: number;
  /** Type-specific metadata */
  metadata: SpotMetadata;
};

// ============================================================================
// Passage Types
// ============================================================================

/**
 * Terrain types for passages.
 * Each type affects movement and has distinct styling.
 */
export type PassageType = 'normal' | 'water' | 'fire' | 'grass';

/**
 * A passage connecting two spots.
 * Passages are bidirectional - can traverse in either direction.
 */
export type Passage = {
  /** Unique identifier */
  id: string;
  /** ID of one connected spot */
  fromSpotId: string;
  /** ID of other connected spot */
  toSpotId: string;
  /** Terrain type affecting movement and styling */
  passageType: PassageType;
};

// ============================================================================
// Board Types
// ============================================================================

/**
 * A complete game board.
 * Dimension-agnostic - canvas manages visual size.
 */
export type Board = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** All spots on the board */
  spots: Spot[];
  /** All passages connecting spots */
  passages: Passage[];
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if spot metadata is of type 'entry'
 */
export function isEntrySpot(metadata: SpotMetadata): metadata is { type: 'entry'; playerId: number } {
  return metadata.type === 'entry';
}

/**
 * Check if spot metadata is of type 'flag'
 */
export function isFlagSpot(metadata: SpotMetadata): metadata is { type: 'flag'; playerId: number } {
  return metadata.type === 'flag';
}

/**
 * Check if spot metadata is of type 'normal'
 */
export function isNormalSpot(metadata: SpotMetadata): metadata is { type: 'normal' } {
  return metadata.type === 'normal';
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new spot with default values
 */
export function createSpot(partial: Partial<Spot> & Pick<Spot, 'id' | 'x' | 'y'>): Spot {
  return {
    name: '',
    metadata: { type: 'normal' },
    ...partial,
  };
}

/**
 * Create a new passage with default values
 */
export function createPassage(
  partial: Partial<Passage> & Pick<Passage, 'id' | 'fromSpotId' | 'toSpotId'>
): Passage {
  return {
    passageType: 'normal',
    ...partial,
  };
}

/**
 * Create a new empty board
 */
export function createBoard(partial: Partial<Board> & Pick<Board, 'id'>): Board {
  return {
    name: '',
    spots: [],
    passages: [],
    ...partial,
  };
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Editing mode for the board creator
 */
export type EditingMode = 'select' | 'add-spot' | 'add-passage' | 'delete';

/**
 * Selection state for the board editor
 */
export type SelectionState = {
  /** Currently selected spot ID (for editing) */
  selectedSpotId: string | null;
  /** Currently selected passage ID (for editing) */
  selectedPassageId: string | null;
  /** When in add-passage mode, the source spot ID */
  passageSourceSpotId: string | null;
};
