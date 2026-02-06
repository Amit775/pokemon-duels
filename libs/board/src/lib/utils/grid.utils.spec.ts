import { describe, it, expect } from 'vitest';
import { snapToGrid, snapPointToGrid, distanceBetweenPoints } from './grid.utils';

describe('Grid Utils', () => {
  describe('snapToGrid', () => {
    it('should snap to nearest grid cell', () => {
      expect(snapToGrid(45, 50)).toBe(50);
      expect(snapToGrid(24, 50)).toBe(0);
      expect(snapToGrid(25, 50)).toBe(50);
      expect(snapToGrid(75, 50)).toBe(100);
    });

    it('should handle exact grid values', () => {
      expect(snapToGrid(100, 50)).toBe(100);
      expect(snapToGrid(0, 50)).toBe(0);
    });

    it('should work with different cell sizes', () => {
      expect(snapToGrid(17, 20)).toBe(20);
      expect(snapToGrid(12, 20)).toBe(20);
      expect(snapToGrid(7, 20)).toBe(0);
    });
  });

  describe('snapPointToGrid', () => {
    it('should snap both coordinates when enabled', () => {
      const result = snapPointToGrid(45, 73, 50, true);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should return original coordinates when disabled', () => {
      const result = snapPointToGrid(45, 73, 50, false);
      expect(result).toEqual({ x: 45, y: 73 });
    });
  });

  describe('distanceBetweenPoints', () => {
    it('should calculate distance correctly', () => {
      expect(distanceBetweenPoints(0, 0, 3, 4)).toBe(5);
      expect(distanceBetweenPoints(0, 0, 0, 0)).toBe(0);
      expect(distanceBetweenPoints(1, 1, 4, 5)).toBe(5);
    });
  });
});
