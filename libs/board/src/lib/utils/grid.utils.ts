/**
 * Grid utility functions for board canvas
 */

/**
 * Snap a coordinate to the nearest grid cell
 */
export function snapToGrid(value: number, cellSize: number): number {
  return Math.round(value / cellSize) * cellSize;
}

/**
 * Snap a point to the grid
 */
export function snapPointToGrid(
  x: number,
  y: number,
  cellSize: number,
  enabled: boolean
): { x: number; y: number } {
  if (!enabled) {
    return { x, y };
  }
  return {
    x: snapToGrid(x, cellSize),
    y: snapToGrid(y, cellSize),
  };
}

/**
 * Calculate distance between two points
 */
export function distanceBetweenPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
