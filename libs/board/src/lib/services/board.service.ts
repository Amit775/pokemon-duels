import { Injectable } from '@angular/core';
import { Board, Spot, Passage } from '../models/board.models';

const STORAGE_KEY = 'pokemon-board';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Save board to localStorage
   */
  saveBoard(board: Board): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }

  /**
   * Load board from localStorage
   * Returns null if no board exists or data is invalid
   */
  loadBoard(): Board | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      if (this.isValidBoard(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear board from localStorage
   */
  clearBoard(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ==========================================================================
  // Export & Import
  // ==========================================================================

  /**
   * Export board to formatted JSON string
   */
  exportBoardToJSON(board: Board): string {
    return JSON.stringify(board, null, 2);
  }

  /**
   * Import board from JSON string
   * Throws error if JSON is invalid or board structure is invalid
   */
  importBoardFromJSON(json: string): Board {
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }

    if (!this.isValidBoard(parsed)) {
      throw new Error('Invalid board structure');
    }

    return parsed;
  }

  // ==========================================================================
  // ID Generation
  // ==========================================================================

  /**
   * Generate a unique ID for spots and passages
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate board structure
   */
  private isValidBoard(data: unknown): data is Board {
    if (!data || typeof data !== 'object') return false;

    const board = data as Record<string, unknown>;

    // Check required fields
    if (typeof board['id'] !== 'string') return false;
    if (typeof board['name'] !== 'string') return false;
    if (!Array.isArray(board['spots'])) return false;
    if (!Array.isArray(board['passages'])) return false;

    // Validate spots
    for (const spot of board['spots'] as unknown[]) {
      if (!this.isValidSpot(spot)) return false;
    }

    // Validate passages
    for (const passage of board['passages'] as unknown[]) {
      if (!this.isValidPassage(passage)) return false;
    }

    return true;
  }

  /**
   * Validate spot structure
   */
  private isValidSpot(data: unknown): data is Spot {
    if (!data || typeof data !== 'object') return false;

    const spot = data as Record<string, unknown>;

    if (typeof spot['id'] !== 'string') return false;
    if (typeof spot['name'] !== 'string') return false;
    if (typeof spot['x'] !== 'number') return false;
    if (typeof spot['y'] !== 'number') return false;
    if (!spot['metadata'] || typeof spot['metadata'] !== 'object') return false;

    const metadata = spot['metadata'] as Record<string, unknown>;
    if (typeof metadata['type'] !== 'string') return false;

    // Validate type-specific fields
    const validTypes = ['normal', 'entry', 'flag'];
    if (!validTypes.includes(metadata['type'] as string)) return false;

    // Entry and flag spots require playerId
    if (metadata['type'] === 'entry' || metadata['type'] === 'flag') {
      if (typeof metadata['playerId'] !== 'number') return false;
      const playerId = metadata['playerId'] as number;
      if (playerId < 1 || playerId > 4 || !Number.isInteger(playerId)) return false;
    }

    return true;
  }

  /**
   * Validate passage structure
   */
  private isValidPassage(data: unknown): data is Passage {
    if (!data || typeof data !== 'object') return false;

    const passage = data as Record<string, unknown>;

    if (typeof passage['id'] !== 'string') return false;
    if (typeof passage['fromSpotId'] !== 'string') return false;
    if (typeof passage['toSpotId'] !== 'string') return false;
    if (typeof passage['passageType'] !== 'string') return false;
    if (!['normal', 'water', 'fire', 'grass'].includes(passage['passageType'] as string)) return false;

    return true;
  }
}
