import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBoard, createPassage, createSpot } from '../models/board.models';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardService],
    });
    service = TestBed.inject(BoardService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // Save & Load
  // ==========================================================================

  describe('saveBoard', () => {
    it('should save board to localStorage', () => {
      const board = createBoard({ id: 'test-board', name: 'Test Board' });

      service.saveBoard(board);

      const stored = localStorage.getItem('pokemon-board');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(board);
    });

    it('should overwrite existing board', () => {
      const board1 = createBoard({ id: 'board-1', name: 'First' });
      const board2 = createBoard({ id: 'board-2', name: 'Second' });

      service.saveBoard(board1);
      service.saveBoard(board2);

      const stored = JSON.parse(localStorage.getItem('pokemon-board')!);
      expect(stored.name).toBe('Second');
    });
  });

  describe('loadBoard', () => {
    it('should return null when no board exists', () => {
      const board = service.loadBoard();

      expect(board).toBeNull();
    });

    it('should load board from localStorage', () => {
      const board = createBoard({
        id: 'test-board',
        name: 'Test Board',
        spots: [createSpot({ id: '1', x: 100, y: 200 })],
        passages: [],
      });
      localStorage.setItem('pokemon-board', JSON.stringify(board));

      const loaded = service.loadBoard();

      expect(loaded).toEqual(board);
    });

    it('should return null for corrupted data', () => {
      localStorage.setItem('pokemon-board', 'not valid json{{{');

      const board = service.loadBoard();

      expect(board).toBeNull();
    });

    it('should return null for invalid board structure', () => {
      localStorage.setItem('pokemon-board', JSON.stringify({ invalid: 'data' }));

      const board = service.loadBoard();

      expect(board).toBeNull();
    });
  });

  describe('clearBoard', () => {
    it('should remove board from localStorage', () => {
      const board = createBoard({ id: 'test-board' });
      service.saveBoard(board);

      service.clearBoard();

      expect(localStorage.getItem('pokemon-board')).toBeNull();
    });
  });

  // ==========================================================================
  // Export & Import
  // ==========================================================================

  describe('exportBoardToJSON', () => {
    it('should return formatted JSON string', () => {
      const board = createBoard({
        id: 'export-test',
        name: 'Export Test',
        spots: [createSpot({ id: '1', x: 50, y: 50, name: 'Spot 1' })],
        passages: [],
      });

      const json = service.exportBoardToJSON(board);

      expect(json).toContain('"id": "export-test"');
      expect(json).toContain('"name": "Export Test"');
      // Should be formatted (pretty-printed)
      expect(json).toContain('\n');
    });

    it('should produce valid JSON', () => {
      const board = createBoard({
        id: 'test',
        name: 'Test',
        spots: [createSpot({ id: '1', x: 0, y: 0 }), createSpot({ id: '2', x: 100, y: 100 })],
        passages: [createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' })],
      });

      const json = service.exportBoardToJSON(board);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(board);
    });
  });

  describe('importBoardFromJSON', () => {
    it('should parse valid JSON into board', () => {
      const board = createBoard({
        id: 'import-test',
        name: 'Import Test',
        spots: [createSpot({ id: '1', x: 25, y: 75 })],
        passages: [],
      });
      const json = JSON.stringify(board);

      const imported = service.importBoardFromJSON(json);

      expect(imported).toEqual(board);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => service.importBoardFromJSON('not valid json{{{')).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidBoard = { name: 'Missing ID' };

      expect(() => service.importBoardFromJSON(JSON.stringify(invalidBoard))).toThrow();
    });

    it('should throw error for invalid spot structure', () => {
      const invalidBoard = {
        id: 'test',
        name: 'Test',
        spots: [{ invalid: 'spot' }],
        passages: [],
      };

      expect(() => service.importBoardFromJSON(JSON.stringify(invalidBoard))).toThrow();
    });

    it('should throw error for invalid passage structure', () => {
      const invalidBoard = {
        id: 'test',
        name: 'Test',
        spots: [],
        passages: [{ invalid: 'passage' }],
      };

      expect(() => service.importBoardFromJSON(JSON.stringify(invalidBoard))).toThrow();
    });
  });

  // ==========================================================================
  // ID Generation
  // ==========================================================================

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = service.generateId();
      const id2 = service.generateId();
      const id3 = service.generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate string IDs', () => {
      const id = service.generateId();

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
