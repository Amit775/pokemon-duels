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
export function isEntrySpot(
  metadata: SpotMetadata,
): metadata is { type: 'entry'; playerId: number } {
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
  partial: Partial<Passage> & Pick<Passage, 'id' | 'fromSpotId' | 'toSpotId'>,
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

// ============================================================================
// Pokemon Types
// ============================================================================

/**
 * Pokemon element type - matches passage types for movement mechanics
 */
export type PokemonType = 'normal' | 'water' | 'fire' | 'grass';

/**
 * Pokemon species definition - template for creating instances
 */
export type PokemonSpecies = {
  /** Unique species identifier */
  id: string;
  /** Display name */
  name: string;
  /** Element type */
  type: PokemonType;
  /** Number of spots the Pokemon can move per turn */
  movement: number;
  /** Path to the Pokemon figure image */
  imageUrl: string;
};

/**
 * A Pokemon instance on the board or bench
 */
export type Pokemon = {
  /** Unique instance identifier */
  id: string;
  /** Reference to the species definition */
  speciesId: string;
  /** Owner player ID (1-4) */
  playerId: number;
  /** Current spot ID (null if on bench) */
  spotId: string | null;
};

/**
 * Predefined Pokemon species for the game
 * Using official Pokemon sprites from PokeAPI
 */
export const POKEMON_SPECIES: Record<string, PokemonSpecies> = {
  snorlax: {
    id: 'snorlax',
    name: 'Snorlax',
    type: 'normal',
    movement: 1,
    imageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
  },
  venusaur: {
    id: 'venusaur',
    name: 'Venusaur',
    type: 'grass',
    movement: 1,
    imageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
  },
  blastoise: {
    id: 'blastoise',
    name: 'Blastoise',
    type: 'water',
    movement: 2,
    imageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
  },
  charizard: {
    id: 'charizard',
    name: 'Charizard',
    type: 'fire',
    movement: 3,
    imageUrl:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
  },
};

/**
 * Get species by ID
 */
export function getSpecies(speciesId: string): PokemonSpecies | undefined {
  return POKEMON_SPECIES[speciesId];
}

/**
 * Create a new Pokemon instance
 */
export function createPokemon(
  partial: Partial<Pokemon> & Pick<Pokemon, 'id' | 'speciesId' | 'playerId'>,
): Pokemon {
  return {
    spotId: null,
    ...partial,
  };
}
