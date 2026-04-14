import { describe, it, expect } from 'vitest';
import { Board, Spot, Passage } from '../models/board.models';
import {
  beautifyBoard,
  initBeautify,
  runFRStep,
  coolTemperature,
  applyPositions,
  BeautifyOptions,
} from './beautify.utils';

// ============================================================================
// Fixtures
// ============================================================================

function makeSpot(
  id: string,
  x: number,
  y: number,
  type: 'normal' | 'entry' | 'flag' = 'normal',
  playerId = 1,
): Spot {
  return {
    id,
    name: '',
    x,
    y,
    metadata:
      type === 'normal'
        ? { type: 'normal' }
        : { type, playerId },
  };
}

function makePassage(id: string, from: string, to: string): Passage {
  return { id, fromSpotId: from, toSpotId: to, passageType: 'normal' };
}

/** A minimal 2-player board: 2 entries, 2 flags, 4 normal spots in a chain */
function makeSimpleBoard(): Board {
  return {
    id: 'test',
    name: 'Test',
    spots: [
      makeSpot('e1', 100, 480, 'entry', 1), // P1 entry — bottom-ish
      makeSpot('e2', 900, 480, 'entry', 1), // P1 entry — bottom-ish
      makeSpot('f1', 500, 480, 'flag', 1),  // P1 flag
      makeSpot('e3', 100,  20, 'entry', 2), // P2 entry — top-ish
      makeSpot('e4', 900,  20, 'entry', 2), // P2 entry — top-ish
      makeSpot('f2', 500,  20, 'flag', 2),  // P2 flag
      makeSpot('n1', 110, 100),              // normal — clustered
      makeSpot('n2', 120, 110),              // normal — clustered
      makeSpot('n3', 130, 390),              // normal — clustered
      makeSpot('n4', 140, 400),              // normal — clustered
    ],
    passages: [
      makePassage('p1', 'e1', 'n1'),
      makePassage('p2', 'n1', 'n2'),
      makePassage('p3', 'n2', 'e3'),
      makePassage('p4', 'e2', 'n3'),
      makePassage('p5', 'n3', 'n4'),
      makePassage('p6', 'n4', 'e4'),
      makePassage('p7', 'n1', 'n3'),
    ],
  };
}

const OPTS: BeautifyOptions = { iterations: 50, padding: 50, width: 1000, height: 500 };

// ============================================================================
// beautifyBoard — full pipeline
// ============================================================================

describe('beautifyBoard', () => {
  it('returns original board unchanged when there are no spots', () => {
    const empty: Board = { id: 'e', name: '', spots: [], passages: [] };
    expect(beautifyBoard(empty)).toBe(empty);
  });

  it('does not mutate the original board', () => {
    const board = makeSimpleBoard();
    const originalPositions = board.spots.map((s) => ({ id: s.id, x: s.x, y: s.y }));
    beautifyBoard(board, OPTS);
    board.spots.forEach((s, i) => {
      expect(s.x).toBe(originalPositions[i].x);
      expect(s.y).toBe(originalPositions[i].y);
    });
  });

  it('preserves passages (topology unchanged)', () => {
    const board = makeSimpleBoard();
    const result = beautifyBoard(board, OPTS);
    expect(result.passages).toEqual(board.passages);
  });

  it('keeps all free (normal) spots within [padding, width-padding] × [padding, height-padding]', () => {
    const { padding, width, height } = OPTS as Required<BeautifyOptions>;
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const result = beautifyBoard(board, OPTS);
    // Fixed spots (entry/flag) keep their pre-positioned or current coordinates
    // and are not subject to the boundary clamp.  Only free spots are constrained.
    for (const spot of result.spots) {
      if (state.fixed.has(spot.id)) continue;
      expect(spot.x).toBeGreaterThanOrEqual(padding);
      expect(spot.x).toBeLessThanOrEqual(width - padding);
      expect(spot.y).toBeGreaterThanOrEqual(padding);
      expect(spot.y).toBeLessThanOrEqual(height - padding);
    }
  });

  it('returns the correct number of spots', () => {
    const board = makeSimpleBoard();
    const result = beautifyBoard(board, OPTS);
    expect(result.spots).toHaveLength(board.spots.length);
  });
});

// ============================================================================
// initBeautify — entry spot pre-positioning
// ============================================================================

describe('initBeautify — entry spot pre-positioning', () => {
  it('moves P1 entry spots to the bottom edge (y = height - padding)', () => {
    const { padding, height } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeSimpleBoard(), OPTS);
    const p1Entries = makeSimpleBoard().spots.filter(
      (s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 1,
    );
    for (const spot of p1Entries) {
      const pos = state.positions.get(spot.id)!;
      expect(pos.y).toBe(height! - padding!);
    }
  });

  it('moves P2 entry spots to the top edge (y = padding)', () => {
    const { padding } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeSimpleBoard(), OPTS);
    const p2Entries = makeSimpleBoard().spots.filter(
      (s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 2,
    );
    for (const spot of p2Entries) {
      const pos = state.positions.get(spot.id)!;
      expect(pos.y).toBe(padding!);
    }
  });

  it('distributes multiple entry spots evenly across x', () => {
    const { padding, width } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeSimpleBoard(), OPTS);
    // P1 has 2 entry spots — should be at x=padding and x=width-padding
    const p1Entries = makeSimpleBoard()
      .spots.filter(
        (s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 1,
      )
      .sort((a, b) => a.x - b.x);

    const xs = p1Entries.map((s) => state.positions.get(s.id)!.x);
    expect(Math.min(...xs)).toBeCloseTo(padding!, 0);
    expect(Math.max(...xs)).toBeCloseTo(width! - padding!, 0);
  });

  it('pins entry spots in the fixed set', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const entryIds = board.spots
      .filter((s) => s.metadata.type === 'entry')
      .map((s) => s.id);
    for (const id of entryIds) {
      expect(state.fixed.has(id)).toBe(true);
    }
  });

  it('pins flag spots in the fixed set', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const flagIds = board.spots.filter((s) => s.metadata.type === 'flag').map((s) => s.id);
    for (const id of flagIds) {
      expect(state.fixed.has(id)).toBe(true);
    }
  });

  it('does not pin normal spots', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const normalIds = board.spots.filter((s) => s.metadata.type === 'normal').map((s) => s.id);
    for (const id of normalIds) {
      expect(state.fixed.has(id)).toBe(false);
    }
  });
});

// ============================================================================
// runFRStep — positions evolve, fixed spots stay put
// ============================================================================

describe('runFRStep', () => {
  it('does not move fixed spots', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);

    const before = new Map<string, { x: number; y: number }>();
    for (const [id, pos] of state.positions) {
      before.set(id, { ...pos });
    }

    runFRStep(board.spots, board.passages, state);

    for (const id of state.fixed) {
      expect(state.positions.get(id)).toEqual(before.get(id));
    }
  });

  it('moves at least one free spot when spots are clustered', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const freeIds = board.spots
      .filter((s) => !state.fixed.has(s.id))
      .map((s) => s.id);

    const before = freeIds.map((id) => ({ ...state.positions.get(id)! }));
    runFRStep(board.spots, board.passages, state);
    const after = freeIds.map((id) => ({ ...state.positions.get(id)! }));

    const anyMoved = freeIds.some((_, i) => {
      return before[i].x !== after[i].x || before[i].y !== after[i].y;
    });
    expect(anyMoved).toBe(true);
  });
});

// ============================================================================
// coolTemperature
// ============================================================================

describe('coolTemperature', () => {
  it('reduces temperature each call', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const initialT = state.temperature;
    coolTemperature(state, 0);
    expect(state.temperature).toBeLessThan(initialT);
  });

  it('temperature approaches 0 by the final iteration', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    for (let i = 0; i < state.opts.iterations; i++) {
      coolTemperature(state, i);
    }
    expect(state.temperature).toBeCloseTo(0, 1);
  });
});

// ============================================================================
// applyPositions — grid snap
// ============================================================================

describe('applyPositions', () => {
  it('rounds x/y to integers', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, OPTS);
    const result = applyPositions(board, state);
    for (const spot of result.spots) {
      expect(Number.isInteger(spot.x)).toBe(true);
      expect(Number.isInteger(spot.y)).toBe(true);
    }
  });

  it('snaps free spots to grid when gridSnap is true', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, { ...OPTS, gridSnap: true, gridCellSize: 50 });
    const result = applyPositions(board, state);
    const freeSpots = result.spots.filter((s) => !state.fixed.has(s.id));
    for (const spot of freeSpots) {
      expect(spot.x % 50).toBe(0);
      expect(spot.y % 50).toBe(0);
    }
  });

  it('does not snap fixed spots even when gridSnap is true', () => {
    const board = makeSimpleBoard();
    const state = initBeautify(board, { ...OPTS, gridSnap: true, gridCellSize: 50 });
    // Force a non-grid-aligned position on a fixed spot
    const [fixedId] = state.fixed;
    state.positions.set(fixedId, { x: 123, y: 456 });
    const result = applyPositions(board, state);
    const fixedSpot = result.spots.find((s) => s.id === fixedId)!;
    expect(fixedSpot.x).toBe(123);
    expect(fixedSpot.y).toBe(456);
  });
});

// ============================================================================
// Single-entry-spot edge case
// ============================================================================

describe('single entry spot per player', () => {
  it('places a lone entry spot at x = width/2', () => {
    const board: Board = {
      id: 't',
      name: '',
      spots: [
        makeSpot('e1', 300, 480, 'entry', 1),
        makeSpot('e2', 300, 20, 'entry', 2),
        makeSpot('n1', 300, 250),
      ],
      passages: [makePassage('p1', 'e1', 'n1'), makePassage('p2', 'n1', 'e2')],
    };
    const state = initBeautify(board, OPTS);
    const pos = state.positions.get('e1')!;
    expect(pos.x).toBeCloseTo(500, 0); // width/2 = 500
  });
});
