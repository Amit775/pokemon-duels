/**
 * Board Beautify Utilities
 *
 * Three-phase layout algorithm designed for 2-player game boards:
 *
 * Phase 0 — Anchor spots
 *   • Entry spots → bench edge (y), evenly distributed within bench x range
 *   • Flag spots  → center of bench (x), same y as their player's entry spots
 *
 * Phase 1 — BFS y-assignment
 *   Multi-source BFS from each player's entry spots gives every free spot a
 *   "depth ratio" (0 = bottom-player side, 1 = top-player side) which maps
 *   directly to a y coordinate.  This respects game flow far better than
 *   force-directed, which has no notion of "player sides".
 *
 * Phase 2 — X-only force-direction
 *   With y locked to the BFS layers, a constrained Fruchterman-Reingold pass
 *   (repulsion + spring attraction, x component only) distributes spots
 *   horizontally and reduces within-layer crossings.
 *
 * Animation
 *   The store drives a smooth eased lerp from each spot's start position to
 *   its computed target — one `computeStep()` call per requestAnimationFrame.
 */

import { Board, Passage, Spot } from '../models/board.models';
import { snapToGrid } from './grid.utils';

// ============================================================================
// Public Types
// ============================================================================

export interface BeautifyOptions {
  /** F-R iterations for x-only distribution after BFS. Default: 150 */
  frIterations?: number;
  /** Number of rAF frames for the lerp animation. Default: 60 */
  animationFrames?: number;
  /** Padding from board edges (px). Default: 50 */
  padding?: number;
  /** Board canvas width (px). Default: 1000 */
  width?: number;
  /** Board canvas height (px). Default: 500 */
  height?: number;
  /**
   * X position of the leftmost bench slot — entry spots are distributed
   * within [benchMinX, benchMaxX], not the full board width.
   * Default: 200
   */
  benchMinX?: number;
  /**
   * X position of the rightmost bench slot.
   * Default: 800
   */
  benchMaxX?: number;
  /** Snap non-fixed spots to grid after layout. Default: false */
  gridSnap?: boolean;
  /** Grid cell size when gridSnap is true. Default: 50 */
  gridCellSize?: number;
}

/** Mutable position map shared between algorithm phases */
export type PositionMap = Map<string, { x: number; y: number }>;

/**
 * All state needed to drive a frame-by-frame animated layout.
 * `currentPositions` is lerped from `startPositions` toward `targetPositions`
 * on each `computeStep()` call.
 */
export interface BeautifyState {
  /** Positions when beautify was triggered (lerp origin) */
  startPositions: PositionMap;
  /** Fully-computed target positions from the layout algorithm */
  targetPositions: PositionMap;
  /** Interpolated positions updated each animation frame */
  currentPositions: PositionMap;
  /** IDs of spots that must not move (entry + flag) */
  fixed: Set<string>;
  /** Current animation frame index */
  step: number;
  /** Total animation frames (from opts.animationFrames) */
  totalSteps: number;
  /** Resolved options with all defaults applied */
  opts: Required<BeautifyOptions>;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULTS: Required<BeautifyOptions> = {
  frIterations: 150,
  animationFrames: 60,
  padding: 50,
  width: 1000,
  height: 500,
  benchMinX: 200,
  benchMaxX: 800,
  gridSnap: false,
  gridCellSize: 50,
};

// ============================================================================
// Internal Helpers
// ============================================================================

/** Multi-source BFS — returns minimum hop-distance from any source to each spot */
function bfsDistances(passages: Passage[], sourceIds: string[]): Map<string, number> {
  // Build adjacency list from passages
  const adj = new Map<string, string[]>();
  for (const p of passages) {
    if (!adj.has(p.fromSpotId)) adj.set(p.fromSpotId, []);
    if (!adj.has(p.toSpotId)) adj.set(p.toSpotId, []);
    adj.get(p.fromSpotId)!.push(p.toSpotId);
    adj.get(p.toSpotId)!.push(p.fromSpotId);
  }

  const dist = new Map<string, number>();
  const queue: string[] = [];

  for (const id of sourceIds) {
    if (!dist.has(id)) {
      dist.set(id, 0);
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const d = dist.get(current)!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!dist.has(neighbor)) {
        dist.set(neighbor, d + 1);
        queue.push(neighbor);
      }
    }
  }

  return dist;
}

/** Smooth easing for animation */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Compute the full target layout for the board.
 * Returns positions for ALL spots (fixed and free) and the fixed set.
 */
function computeTargetLayout(
  spots: Spot[],
  passages: Passage[],
  opts: Required<BeautifyOptions>,
): { positions: PositionMap; fixed: Set<string> } {
  const { padding, width, height, benchMinX, benchMaxX, frIterations } = opts;

  const positions: PositionMap = new Map(spots.map((s) => [s.id, { x: s.x, y: s.y }]));
  const fixed = new Set<string>();

  if (spots.length === 0) return { positions, fixed };

  // ===========================================================================
  // Phase 0: Anchor spots (entry + flag)
  // ===========================================================================

  // Group entry spots by player; infer each player's vertical side from avg y
  const entryByPlayer = new Map<number, Spot[]>();
  for (const spot of spots) {
    if (spot.metadata.type !== 'entry') continue;
    const pid = spot.metadata.playerId;
    if (!entryByPlayer.has(pid)) entryByPlayer.set(pid, []);
    entryByPlayer.get(pid)!.push(spot);
  }

  // Target y per player (bottom edge or top edge of board)
  const playerTargetY = new Map<number, number>();
  for (const [pid, entrySpots] of entryByPlayer) {
    const avgY = entrySpots.reduce((s, e) => s + e.y, 0) / entrySpots.length;
    const isBottom = avgY > height / 2;
    playerTargetY.set(pid, isBottom ? height - padding : padding);
  }

  // Place entry spots: y = bench edge, x distributed evenly within bench range
  for (const [pid, entrySpots] of entryByPlayer) {
    const targetY = playerTargetY.get(pid)!;
    const sorted = [...entrySpots].sort((a, b) => a.x - b.x);
    const n = sorted.length;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = benchMinX + t * (benchMaxX - benchMinX);
      positions.set(sorted[i].id, { x, y: targetY });
      fixed.add(sorted[i].id);
    }
  }

  // Place flag spots: x = center of bench, y = same as player's entry spots
  // If no entry info for a player, fall back to their current vertical side.
  for (const spot of spots) {
    if (spot.metadata.type !== 'flag') continue;
    const pid = spot.metadata.playerId;
    const targetY =
      playerTargetY.get(pid) ?? (spot.y > height / 2 ? height - padding : padding);
    const x = (benchMinX + benchMaxX) / 2;
    positions.set(spot.id, { x, y: targetY });
    fixed.add(spot.id);
  }

  // ===========================================================================
  // Phase 1: BFS y-assignment for free spots
  // ===========================================================================

  // Separate entry spots into "bottom" side (large y) and "top" side (small y)
  const bottomEntryIds: string[] = [];
  const topEntryIds: string[] = [];
  for (const [pid, entrySpots] of entryByPlayer) {
    const targetY = playerTargetY.get(pid)!;
    const ids = entrySpots.map((s) => s.id);
    if (targetY > height / 2) {
      bottomEntryIds.push(...ids);
    } else {
      topEntryIds.push(...ids);
    }
  }

  const bottomY = height - padding;
  const topY = padding;

  // Only run BFS if we have both sides; otherwise y stays as-is
  if (bottomEntryIds.length > 0 && topEntryIds.length > 0) {
    const dBottom = bfsDistances(passages, bottomEntryIds);
    const dTop = bfsDistances(passages, topEntryIds);

    for (const spot of spots) {
      if (fixed.has(spot.id)) continue;

      const d1 = dBottom.get(spot.id) ?? Infinity;
      const d2 = dTop.get(spot.id) ?? Infinity;

      let ratio: number;
      if (d1 === Infinity && d2 === Infinity) {
        ratio = 0.5; // unreachable from either side → place in middle
      } else if (d1 === Infinity) {
        ratio = 1; // only reachable from top → place near top
      } else if (d2 === Infinity) {
        ratio = 0; // only reachable from bottom → place near bottom
      } else {
        // ratio=0 → closer to bottom, ratio=1 → closer to top
        ratio = d1 / (d1 + d2);
      }

      const y = bottomY + ratio * (topY - bottomY);
      const current = positions.get(spot.id)!;
      positions.set(spot.id, { x: current.x, y });
    }
  }

  // ===========================================================================
  // Phase 2: X-only Fruchterman-Reingold
  // Y is locked; only horizontal displacement is applied.
  // This distributes spots within their layers and reduces crossing.
  // ===========================================================================

  const area = (width - 2 * padding) * (height - 2 * padding);
  const k = Math.sqrt(area / Math.max(spots.length, 1));
  let temperature = (width - 2 * padding) / 5; // tighter initial temp for x-only

  for (let iter = 0; iter < frIterations; iter++) {
    const dispX = new Map<string, number>();
    for (const spot of spots) dispX.set(spot.id, 0);

    // Repulsive forces (x component only)
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
        dispX.set(u.id, dispX.get(u.id)! + (dx / dist) * fr);
        dispX.set(v.id, dispX.get(v.id)! - (dx / dist) * fr);
      }
    }

    // Attractive forces along passages (x component only)
    for (const passage of passages) {
      const pu = positions.get(passage.fromSpotId);
      const pv = positions.get(passage.toSpotId);
      if (!pu || !pv) continue;
      const dx = pu.x - pv.x;
      const dy = pu.y - pv.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const fa = (dist * dist) / k;
      dispX.set(passage.fromSpotId, dispX.get(passage.fromSpotId)! - (dx / dist) * fa);
      dispX.set(passage.toSpotId, dispX.get(passage.toSpotId)! + (dx / dist) * fa);
    }

    // Apply x displacements (non-fixed spots only, y unchanged)
    for (const spot of spots) {
      if (fixed.has(spot.id)) continue;
      const d = dispX.get(spot.id)!;
      const absD = Math.abs(d);
      const scale = Math.min(absD, temperature) / (absD || 1);
      const p = positions.get(spot.id)!;
      p.x = Math.max(padding, Math.min(width - padding, p.x + d * scale));
    }

    // Cool temperature linearly
    temperature *= 1 - (iter + 1) / frIterations;
  }

  return { positions, fixed };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialise all state required to animate the beautify algorithm.
 *
 * Computes the full target layout synchronously (BFS + x-only F-R), then
 * stores both the start and target positions so the caller can drive a
 * smooth lerp via `computeStep()`.
 */
export function initBeautify(board: Board, options?: BeautifyOptions): BeautifyState {
  const opts: Required<BeautifyOptions> = { ...DEFAULTS, ...options };

  const startPositions: PositionMap = new Map(
    board.spots.map((s) => [s.id, { x: s.x, y: s.y }]),
  );

  const { positions: targetPositions, fixed } = computeTargetLayout(
    board.spots,
    board.passages,
    opts,
  );

  // currentPositions starts at the start; computeStep() lerps it toward target
  const currentPositions: PositionMap = new Map(
    board.spots.map((s) => [s.id, { x: s.x, y: s.y }]),
  );

  return {
    startPositions,
    targetPositions,
    currentPositions,
    fixed,
    step: 0,
    totalSteps: opts.animationFrames,
    opts,
  };
}

/**
 * Advance the animation by one frame.
 *
 * Lerps `currentPositions` toward `targetPositions` using a cubic ease-in-out.
 * Returns `true` when the animation is complete (step >= totalSteps).
 */
export function computeStep(state: BeautifyState): boolean {
  state.step++;
  const t = easeInOutCubic(Math.min(state.step / state.totalSteps, 1));

  for (const [id, start] of state.startPositions) {
    if (state.fixed.has(id)) continue;
    const target = state.targetPositions.get(id)!;
    state.currentPositions.set(id, {
      x: start.x + (target.x - start.x) * t,
      y: start.y + (target.y - start.y) * t,
    });
  }

  return state.step >= state.totalSteps;
}

/**
 * Write the final target positions back to a Board, returning a new Board.
 * Applies optional grid snap to non-fixed spots.
 * Does not mutate the original board.
 */
export function applyPositions(board: Board, state: BeautifyState): Board {
  const { targetPositions, fixed, opts } = state;
  const { gridSnap, gridCellSize } = opts;

  return {
    ...board,
    spots: board.spots.map((spot) => {
      const p = targetPositions.get(spot.id)!;
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
 * Computes and applies the layout in one synchronous call.
 * Use `initBeautify` + `computeStep` for the animated path.
 */
export function beautifyBoard(board: Board, options?: BeautifyOptions): Board {
  if (board.spots.length === 0) return board;
  const state = initBeautify(board, options);
  return applyPositions(board, state);
}
