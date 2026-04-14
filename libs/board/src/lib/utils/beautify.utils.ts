/**
 * Board Beautify Utilities
 *
 * Implements a constrained Fruchterman-Reingold force-directed layout algorithm
 * to improve the visual appearance of custom boards without changing their topology.
 *
 * Phase 0 — Pre-position entry spots near their bench edges
 * Phase 1 — Pin entry + flag spots; free spots float
 * Phase 2 — Fruchterman-Reingold iterations (repulsion + spring attraction)
 * Phase 3 — Optional grid snap on non-fixed spots
 */

import { Board, Passage, Spot } from '../models/board.models';
import { snapToGrid } from './grid.utils';

// ============================================================================
// Public Types
// ============================================================================

export interface BeautifyOptions {
  /** Number of F-R iterations to run. Default: 300 */
  iterations?: number;
  /** Iterations to run per animation frame. Default: 5 */
  stepsPerFrame?: number;
  /** Padding from board edges (px). Default: 50 */
  padding?: number;
  /** Board canvas width (px). Default: 1000 */
  width?: number;
  /** Board canvas height (px). Default: 500 */
  height?: number;
  /** Snap non-fixed spots to grid after layout. Default: false */
  gridSnap?: boolean;
  /** Grid cell size when gridSnap is true. Default: 50 */
  gridCellSize?: number;
}

/** Mutable position map used during layout computation */
export type PositionMap = Map<string, { x: number; y: number }>;

/** All state needed to drive a step-by-step animated layout */
export interface BeautifyState {
  /** Current positions of all spots (mutated each step) */
  positions: PositionMap;
  /** IDs of spots that must not move */
  fixed: Set<string>;
  /** Ideal spring length — sqrt(area / n) */
  k: number;
  /** Current temperature (decreases each iteration) */
  temperature: number;
  /** Resolved options with all defaults applied */
  opts: Required<BeautifyOptions>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULTS: Required<BeautifyOptions> = {
  iterations: 300,
  stepsPerFrame: 5,
  padding: 50,
  width: 1000,
  height: 500,
  gridSnap: false,
  gridCellSize: 50,
};

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Phase 0: Move each player's entry spots to the board edge closest to their
 * bench, distributed evenly across the board width.
 *
 * "Closest bench edge" is determined by the current average y of each player's
 * entry spots: avg y > height/2 → bottom edge, otherwise → top edge.
 *
 * Returns the set of spot IDs that were repositioned (they are then pinned).
 */
function prePositionEntrySpots(
  spots: Spot[],
  positions: PositionMap,
  opts: Required<BeautifyOptions>,
): Set<string> {
  const { padding, width, height } = opts;
  const fixed = new Set<string>();

  // Group entry spots by player
  const byPlayer = new Map<number, Spot[]>();
  for (const spot of spots) {
    if (spot.metadata.type !== 'entry') continue;
    const pid = spot.metadata.playerId;
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid)!.push(spot);
  }

  for (const entrySpots of byPlayer.values()) {
    // Determine vertical side from current average y
    const avgY = entrySpots.reduce((sum, s) => sum + s.y, 0) / entrySpots.length;
    const isBottom = avgY > height / 2;
    const targetY = isBottom ? height - padding : padding;

    // Sort left-to-right by current x, then distribute evenly across width
    const sorted = [...entrySpots].sort((a, b) => a.x - b.x);
    const n = sorted.length;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = padding + t * (width - 2 * padding);
      positions.set(sorted[i].id, { x, y: targetY });
      fixed.add(sorted[i].id);
    }
  }

  return fixed;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialise all state required to run the beautify algorithm.
 *
 * Call this once, then drive iteration with `runFRStep`, then apply results
 * with `applyPositions`. Or just call `beautifyBoard` for the full pipeline.
 */
export function initBeautify(board: Board, options?: BeautifyOptions): BeautifyState {
  const opts: Required<BeautifyOptions> = { ...DEFAULTS, ...options };
  const { padding, width, height } = opts;

  // Copy current positions (we mutate these in place during layout)
  const positions: PositionMap = new Map(board.spots.map((s) => [s.id, { x: s.x, y: s.y }]));

  // Phase 0: pre-position entry spots near bench edges and mark them fixed
  const fixed = prePositionEntrySpots(board.spots, positions, opts);

  // Phase 1: also pin flag spots at their current positions
  for (const spot of board.spots) {
    if (spot.metadata.type === 'flag') {
      fixed.add(spot.id);
    }
  }

  const area = (width - 2 * padding) * (height - 2 * padding);
  const k = Math.sqrt(area / Math.max(board.spots.length, 1));
  const temperature = width / 10;

  return { positions, fixed, k, temperature, opts };
}

/**
 * Run one iteration of Fruchterman-Reingold.
 *
 * Mutates `state.positions` in place.
 * Call this in a loop (or per animation frame), decrementing `state.temperature`
 * after each call using `coolTemperature`.
 */
export function runFRStep(
  spots: Spot[],
  passages: Passage[],
  state: BeautifyState,
): void {
  const { positions, fixed, k, temperature, opts } = state;
  const { padding, width, height } = opts;

  // Accumulate displacement for each spot
  const displacement = new Map<string, { x: number; y: number }>();
  for (const spot of spots) {
    displacement.set(spot.id, { x: 0, y: 0 });
  }

  // Repulsive forces — every pair of spots pushes each other apart
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const u = spots[i];
      const v = spots[j];
      const pu = positions.get(u.id)!;
      const pv = positions.get(v.id)!;
      const dx = pu.x - pv.x;
      const dy = pu.y - pv.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const fr = (k * k) / dist;
      const du = displacement.get(u.id)!;
      const dv = displacement.get(v.id)!;
      du.x += (dx / dist) * fr;
      du.y += (dy / dist) * fr;
      dv.x -= (dx / dist) * fr;
      dv.y -= (dy / dist) * fr;
    }
  }

  // Attractive forces — each passage pulls its two spots together
  for (const passage of passages) {
    const pu = positions.get(passage.fromSpotId);
    const pv = positions.get(passage.toSpotId);
    if (!pu || !pv) continue;
    const dx = pu.x - pv.x;
    const dy = pu.y - pv.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const fa = (dist * dist) / k;
    const du = displacement.get(passage.fromSpotId)!;
    const dv = displacement.get(passage.toSpotId)!;
    du.x -= (dx / dist) * fa;
    du.y -= (dy / dist) * fa;
    dv.x += (dx / dist) * fa;
    dv.y += (dy / dist) * fa;
  }

  // Apply displacement — only to non-fixed spots, capped by temperature
  for (const spot of spots) {
    if (fixed.has(spot.id)) continue;
    const d = displacement.get(spot.id)!;
    const p = positions.get(spot.id)!;
    const dist = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01;
    const scale = Math.min(dist, temperature) / dist;
    p.x = Math.max(padding, Math.min(width - padding, p.x + d.x * scale));
    p.y = Math.max(padding, Math.min(height - padding, p.y + d.y * scale));
  }
}

/**
 * Cool the temperature after an iteration.
 * Uses linear cooling: T_i = T_0 * (1 - i/N).
 */
export function coolTemperature(state: BeautifyState, iter: number): void {
  state.temperature *= 1 - (iter + 1) / state.opts.iterations;
}

/**
 * Apply final positions from `state` back to a board, returning a new Board.
 * Optionally snaps non-fixed spots to the grid.
 *
 * Does not mutate the original board or spots.
 */
export function applyPositions(board: Board, state: BeautifyState): Board {
  const { positions, fixed, opts } = state;
  const { gridSnap, gridCellSize } = opts;

  return {
    ...board,
    spots: board.spots.map((spot) => {
      const p = positions.get(spot.id)!;
      let x = Math.round(p.x);
      let y = Math.round(p.y);
      if (gridSnap && !fixed.has(spot.id)) {
        x = snapToGrid(x, gridCellSize);
        y = snapToGrid(y, gridCellSize);
      }
      return { ...spot, x, y };
    }),
  };
}

/**
 * Instant full-pipeline beautify.
 *
 * Runs all iterations synchronously and returns a new Board.
 * Use `initBeautify` + `runFRStep` + `coolTemperature` for the animated path.
 */
export function beautifyBoard(board: Board, options?: BeautifyOptions): Board {
  if (board.spots.length === 0) return board;

  const state = initBeautify(board, options);
  const { iterations } = state.opts;

  for (let iter = 0; iter < iterations; iter++) {
    runFRStep(board.spots, board.passages, state);
    coolTemperature(state, iter);
  }

  return applyPositions(board, state);
}
