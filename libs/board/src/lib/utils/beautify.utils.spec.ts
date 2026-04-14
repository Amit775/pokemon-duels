import { describe, it, expect } from 'vitest';
import { Board, Spot, Passage } from '../models/board.models';
import {
  beautifyBoard,
  initBeautify,
  computeStep,
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
    metadata: type === 'normal' ? { type: 'normal' } : { type, playerId },
  };
}

function makePassage(id: string, from: string, to: string): Passage {
  return { id, fromSpotId: from, toSpotId: to, passageType: 'normal' };
}

/**
 * Standard 2-player board: 2 entries + 1 flag per player, 4 normal spots.
 * P1 (bottom): entries at y≈480, flag at y≈480
 * P2 (top):    entries at y≈20,  flag at y≈20
 */
function makeBoard(): Board {
  return {
    id: 'test',
    name: 'Test',
    spots: [
      makeSpot('e1a', 200, 480, 'entry', 1),
      makeSpot('e1b', 800, 480, 'entry', 1),
      makeSpot('f1',  500, 480, 'flag',  1),
      makeSpot('e2a', 200,  20, 'entry', 2),
      makeSpot('e2b', 800,  20, 'entry', 2),
      makeSpot('f2',  500,  20, 'flag',  2),
      makeSpot('n1',  110, 100),
      makeSpot('n2',  120, 110),
      makeSpot('n3',  130, 390),
      makeSpot('n4',  140, 400),
    ],
    passages: [
      makePassage('p1', 'e1a', 'n3'),
      makePassage('p2', 'n3',  'n4'),
      makePassage('p3', 'n4',  'e1b'),
      makePassage('p4', 'e2a', 'n1'),
      makePassage('p5', 'n1',  'n2'),
      makePassage('p6', 'n2',  'e2b'),
      makePassage('p7', 'n3',  'n1'),
    ],
  };
}

const OPTS: BeautifyOptions = {
  frIterations: 50,
  animationFrames: 10,
  padding: 50,
  width: 1000,
  height: 500,
  benchMinX: 200,
  benchMaxX: 800,
};

// ============================================================================
// beautifyBoard — full instant pipeline
// ============================================================================

describe('beautifyBoard', () => {
  it('returns original board unchanged when there are no spots', () => {
    const empty: Board = { id: 'e', name: '', spots: [], passages: [] };
    expect(beautifyBoard(empty)).toBe(empty);
  });

  it('does not mutate the original board', () => {
    const board = makeBoard();
    const snap = board.spots.map((s) => ({ id: s.id, x: s.x, y: s.y }));
    beautifyBoard(board, OPTS);
    board.spots.forEach((s, i) => {
      expect(s.x).toBe(snap[i].x);
      expect(s.y).toBe(snap[i].y);
    });
  });

  it('preserves passages (topology unchanged)', () => {
    const board = makeBoard();
    expect(beautifyBoard(board, OPTS).passages).toEqual(board.passages);
  });

  it('returns the correct number of spots', () => {
    const board = makeBoard();
    expect(beautifyBoard(board, OPTS).spots).toHaveLength(board.spots.length);
  });

  it('keeps free spots within board bounds', () => {
    const { padding, width, height } = OPTS as Required<BeautifyOptions>;
    const board = makeBoard();
    const state = initBeautify(board, OPTS);
    const result = beautifyBoard(board, OPTS);
    for (const spot of result.spots) {
      if (state.fixed.has(spot.id)) continue;
      expect(spot.x).toBeGreaterThanOrEqual(padding);
      expect(spot.x).toBeLessThanOrEqual(width - padding);
      expect(spot.y).toBeGreaterThanOrEqual(padding);
      expect(spot.y).toBeLessThanOrEqual(height - padding);
    }
  });
});

// ============================================================================
// Phase 0: Entry spot positioning
// ============================================================================

describe('entry spot positioning', () => {
  it('places P1 entry spots at the bottom edge (y = height - padding)', () => {
    const { padding, height } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    const p1EntryIds = makeBoard().spots
      .filter((s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 1)
      .map((s) => s.id);
    for (const id of p1EntryIds) {
      expect(state.targetPositions.get(id)!.y).toBe(height - padding);
    }
  });

  it('places P2 entry spots at the top edge (y = padding)', () => {
    const { padding } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    const p2EntryIds = makeBoard().spots
      .filter((s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 2)
      .map((s) => s.id);
    for (const id of p2EntryIds) {
      expect(state.targetPositions.get(id)!.y).toBe(padding);
    }
  });

  it('distributes P1 entry spots within [benchMinX, benchMaxX]', () => {
    const { benchMinX, benchMaxX } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    const p1EntryIds = makeBoard().spots
      .filter((s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 1)
      .map((s) => s.id);
    const xs = p1EntryIds.map((id) => state.targetPositions.get(id)!.x);
    expect(Math.min(...xs)).toBeCloseTo(benchMinX!, 0);
    expect(Math.max(...xs)).toBeCloseTo(benchMaxX!, 0);
  });

  it('pins entry spots in the fixed set', () => {
    const state = initBeautify(makeBoard(), OPTS);
    for (const spot of makeBoard().spots.filter((s) => s.metadata.type === 'entry')) {
      expect(state.fixed.has(spot.id)).toBe(true);
    }
  });
});

// ============================================================================
// Phase 0: Flag spot positioning
// ============================================================================

describe('flag spot positioning', () => {
  it('places P1 flag at center x of bench', () => {
    const { benchMinX, benchMaxX } = OPTS as Required<BeautifyOptions>;
    const centerX = (benchMinX! + benchMaxX!) / 2;
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.targetPositions.get('f1')!.x).toBeCloseTo(centerX, 0);
  });

  it('places P2 flag at center x of bench', () => {
    const { benchMinX, benchMaxX } = OPTS as Required<BeautifyOptions>;
    const centerX = (benchMinX! + benchMaxX!) / 2;
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.targetPositions.get('f2')!.x).toBeCloseTo(centerX, 0);
  });

  it('places P1 flag at same y as P1 entry spots', () => {
    const { padding, height } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.targetPositions.get('f1')!.y).toBe(height - padding);
  });

  it('places P2 flag at same y as P2 entry spots', () => {
    const { padding } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.targetPositions.get('f2')!.y).toBe(padding);
  });

  it('pins flag spots in the fixed set', () => {
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.fixed.has('f1')).toBe(true);
    expect(state.fixed.has('f2')).toBe(true);
  });
});

// ============================================================================
// Phase 1: BFS y-assignment — bottom-side spots stay below middle
// ============================================================================

describe('BFS y-assignment', () => {
  it('places spots closer to P1 entries below vertical center', () => {
    const { height } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    // n3 and n4 are only 1 hop from P1 entries → should be in lower half
    const n3y = state.targetPositions.get('n3')!.y;
    const n4y = state.targetPositions.get('n4')!.y;
    expect(n3y).toBeGreaterThan(height / 2);
    expect(n4y).toBeGreaterThan(height / 2);
  });

  it('places spots closer to P2 entries above vertical center', () => {
    const { height } = OPTS as Required<BeautifyOptions>;
    const state = initBeautify(makeBoard(), OPTS);
    // n1 and n2 are only 1 hop from P2 entries → should be in upper half
    const n1y = state.targetPositions.get('n1')!.y;
    const n2y = state.targetPositions.get('n2')!.y;
    expect(n1y).toBeLessThan(height / 2);
    expect(n2y).toBeLessThan(height / 2);
  });

  it('does not pin normal spots', () => {
    const state = initBeautify(makeBoard(), OPTS);
    for (const spot of makeBoard().spots.filter((s) => s.metadata.type === 'normal')) {
      expect(state.fixed.has(spot.id)).toBe(false);
    }
  });
});

// ============================================================================
// computeStep — lerp animation
// ============================================================================

describe('computeStep', () => {
  it('moves currentPositions toward targetPositions', () => {
    const board = makeBoard();
    const state = initBeautify(board, OPTS);
    const freeId = board.spots.find((s) => s.metadata.type === 'normal')!.id;

    const before = { ...state.currentPositions.get(freeId)! };
    computeStep(state);
    const after = state.currentPositions.get(freeId)!;

    const target = state.targetPositions.get(freeId)!;
    const start  = state.startPositions.get(freeId)!;

    if (start.x !== target.x || start.y !== target.y) {
      // Position should have moved closer to target
      const distBefore = Math.abs(before.x - target.x) + Math.abs(before.y - target.y);
      const distAfter  = Math.abs(after.x  - target.x) + Math.abs(after.y  - target.y);
      expect(distAfter).toBeLessThanOrEqual(distBefore);
    }
  });

  it('does not move fixed spots', () => {
    const board = makeBoard();
    const state = initBeautify(board, OPTS);
    const fixedId = [...state.fixed][0];
    const before = { ...state.currentPositions.get(fixedId)! };
    computeStep(state);
    // fixed spots are never written to currentPositions by computeStep
    expect(state.currentPositions.get(fixedId)).toEqual(before);
  });

  it('returns true when totalSteps is reached', () => {
    const state = initBeautify(makeBoard(), { ...OPTS, animationFrames: 3 });
    expect(computeStep(state)).toBe(false);
    expect(computeStep(state)).toBe(false);
    expect(computeStep(state)).toBe(true);
  });

  it('increments step each call', () => {
    const state = initBeautify(makeBoard(), OPTS);
    expect(state.step).toBe(0);
    computeStep(state);
    expect(state.step).toBe(1);
    computeStep(state);
    expect(state.step).toBe(2);
  });
});

// ============================================================================
// applyPositions
// ============================================================================

describe('applyPositions', () => {
  it('rounds coordinates to integers', () => {
    const board = makeBoard();
    const result = applyPositions(board, initBeautify(board, OPTS));
    for (const spot of result.spots) {
      expect(Number.isInteger(spot.x)).toBe(true);
      expect(Number.isInteger(spot.y)).toBe(true);
    }
  });

  it('snaps free spots to grid when gridSnap is true', () => {
    const board = makeBoard();
    const state = initBeautify(board, { ...OPTS, gridSnap: true, gridCellSize: 50 });
    const result = applyPositions(board, state);
    for (const spot of result.spots.filter((s) => !state.fixed.has(s.id))) {
      expect(spot.x % 50).toBe(0);
      expect(spot.y % 50).toBe(0);
    }
  });

  it('does not snap fixed spots even when gridSnap is true', () => {
    const board = makeBoard();
    const state = initBeautify(board, { ...OPTS, gridSnap: true, gridCellSize: 50 });
    const [fixedId] = state.fixed;
    // Force an off-grid target
    state.targetPositions.set(fixedId, { x: 123, y: 456 });
    const result = applyPositions(board, state);
    const spot = result.spots.find((s) => s.id === fixedId)!;
    expect(spot.x).toBe(123);
    expect(spot.y).toBe(456);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('single entry spot per player', () => {
  it('centers the lone entry spot at bench center x', () => {
    const { benchMinX, benchMaxX } = OPTS as Required<BeautifyOptions>;
    const centerX = (benchMinX! + benchMaxX!) / 2;
    const board: Board = {
      id: 't', name: '',
      spots: [
        makeSpot('e1', 300, 480, 'entry', 1),
        makeSpot('e2', 300,  20, 'entry', 2),
        makeSpot('n1', 300, 250),
      ],
      passages: [
        makePassage('p1', 'e1', 'n1'),
        makePassage('p2', 'n1', 'e2'),
      ],
    };
    const state = initBeautify(board, OPTS);
    expect(state.targetPositions.get('e1')!.x).toBeCloseTo(centerX, 0);
    expect(state.targetPositions.get('e2')!.x).toBeCloseTo(centerX, 0);
  });
});
