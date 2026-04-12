import { describe, it, expect } from 'vitest';
import { findReachableSpots, findReachableSpotsFromEntry } from './movement.utils';
import { Spot, Passage } from '../models/board.models';

// ============================================================================
// Fixtures
//
// Board layout: A - B - C - D - E  (linear chain)
//                       |
//                       F          (branch off C)
//
// A=entry(p1), E=flag(p2), others=normal
// ============================================================================

const makeSpot = (id: string, x = 0, y = 0, type: 'normal' | 'entry' | 'flag' = 'normal'): Spot => ({
  id,
  name: id,
  x,
  y,
  metadata: type === 'entry' ? { type: 'entry', playerId: 1 }
           : type === 'flag'  ? { type: 'flag', playerId: 2 }
           : { type: 'normal' },
});

const makePassage = (from: string, to: string): Passage => ({
  id: `${from}-${to}`,
  fromSpotId: from,
  toSpotId: to,
  passageType: 'normal',
});

const spots: Spot[] = [
  makeSpot('A', 0, 0, 'entry'),
  makeSpot('B', 100, 0),
  makeSpot('C', 200, 0),
  makeSpot('D', 300, 0),
  makeSpot('E', 400, 0, 'flag'),
  makeSpot('F', 200, 100), // branch off C
];

const passages: Passage[] = [
  makePassage('A', 'B'),
  makePassage('B', 'C'),
  makePassage('C', 'D'),
  makePassage('D', 'E'),
  makePassage('C', 'F'),
];

const empty = new Set<string>();

// ============================================================================
// findReachableSpots
// ============================================================================

describe('findReachableSpots', () => {
  it('returns empty array when maxMoves is 0', () => {
    expect(findReachableSpots('A', 0, spots, passages, empty, empty)).toEqual([]);
  });

  it('reaches only adjacent spots with movement 1', () => {
    const result = findReachableSpots('B', 1, spots, passages, empty, empty);
    expect(result).toContain('A');
    expect(result).toContain('C');
    expect(result).not.toContain('D'); // 2 hops away
    expect(result).not.toContain('B'); // start is never included
  });

  it('reaches two hops away with movement 2', () => {
    const result = findReachableSpots('B', 2, spots, passages, empty, empty);
    expect(result).toContain('A');
    expect(result).toContain('C');
    expect(result).toContain('D'); // 2 hops from B via C
    expect(result).toContain('F'); // 2 hops from B via C
    expect(result).not.toContain('E'); // 3 hops away
    expect(result).not.toContain('B');
  });

  it('does not include the starting spot', () => {
    const result = findReachableSpots('C', 3, spots, passages, empty, empty);
    expect(result).not.toContain('C');
  });

  it('can reach end of chain with enough movement', () => {
    const result = findReachableSpots('A', 4, spots, passages, empty, empty);
    expect(result).toContain('E');
  });

  it('includes branch spots within movement range', () => {
    const result = findReachableSpots('A', 3, spots, passages, empty, empty);
    expect(result).toContain('F'); // A→B→C→F = 3 moves
  });

  describe('own pokemon blocking', () => {
    it('cannot land on spot occupied by own pokemon', () => {
      const ownOccupied = new Set(['B']);
      const result = findReachableSpots('A', 2, spots, passages, ownOccupied, empty);
      expect(result).not.toContain('B'); // blocked — can't land
    });

    it('cannot pass through spot occupied by own pokemon', () => {
      const ownOccupied = new Set(['B']);
      const result = findReachableSpots('A', 3, spots, passages, ownOccupied, empty);
      // B is blocked — C and D are unreachable since path goes through B
      expect(result).not.toContain('C');
      expect(result).not.toContain('D');
    });
  });

  describe('enemy pokemon blocking', () => {
    it('can land on spot occupied by enemy pokemon (battle)', () => {
      const enemyOccupied = new Set(['B']);
      const result = findReachableSpots('A', 2, spots, passages, empty, enemyOccupied);
      expect(result).toContain('B'); // can attack
    });

    it('cannot pass through spot occupied by enemy (battle stops movement)', () => {
      const enemyOccupied = new Set(['B']);
      const result = findReachableSpots('A', 3, spots, passages, empty, enemyOccupied);
      expect(result).toContain('B');   // can attack B
      expect(result).not.toContain('C'); // can't pass through B
      expect(result).not.toContain('D');
    });
  });

  it('returns each spot at most once even with multiple paths', () => {
    // In this graph C is reachable via B from A (A→B→C)
    // and via B is the only path, but check no duplicates
    const result = findReachableSpots('A', 3, spots, passages, empty, empty);
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });

  it('returns empty when start spot has no passages', () => {
    const isolatedSpot = makeSpot('Z');
    const result = findReachableSpots('Z', 3, [isolatedSpot, ...spots], passages, empty, empty);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// findReachableSpotsFromEntry
// ============================================================================

describe('findReachableSpotsFromEntry', () => {
  it('returns empty when totalMoves is 1 (entry itself costs 1 move, none left)', () => {
    // The caller (GameStore.selectPokemon) adds the entry spot itself;
    // this function only returns spots *beyond* the entry.
    const result = findReachableSpotsFromEntry('A', 1, spots, passages, empty, empty);
    expect(result).toEqual([]);
  });

  it('returns spots one hop beyond entry when totalMoves is 2', () => {
    // 2 moves total, 1 spent entering → 1 remaining → only B reachable from A
    const result = findReachableSpotsFromEntry('A', 2, spots, passages, empty, empty);
    expect(result).toContain('B');
    expect(result).not.toContain('C');
    expect(result).not.toContain('A'); // entry itself not included
  });

  it('returns spots two hops beyond entry when totalMoves is 3', () => {
    // 3 moves total, 1 spent entering → 2 remaining → B and C reachable from A
    const result = findReachableSpotsFromEntry('A', 3, spots, passages, empty, empty);
    expect(result).toContain('B');
    expect(result).toContain('C');
    expect(result).not.toContain('D'); // 3 hops beyond entry
  });

  it('respects own-pokemon blocking beyond entry', () => {
    const ownOccupied = new Set(['B']);
    // Can't pass through B, so C unreachable even with movement 3
    const result = findReachableSpotsFromEntry('A', 3, spots, passages, ownOccupied, empty);
    expect(result).not.toContain('B');
    expect(result).not.toContain('C');
  });

  it('allows landing on enemy beyond entry (battle)', () => {
    const enemyOccupied = new Set(['B']);
    const result = findReachableSpotsFromEntry('A', 2, spots, passages, empty, enemyOccupied);
    expect(result).toContain('B');
  });
});
