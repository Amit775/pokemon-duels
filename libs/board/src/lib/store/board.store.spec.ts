import { TestBed } from '@angular/core/testing';
import { BoardStore } from './board.store';
import { Spot, Passage, createSpot, createPassage } from '../models/board.models';

describe('BoardStore', () => {
  let store: InstanceType<typeof BoardStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardStore],
    });
    store = TestBed.inject(BoardStore);
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('should start with empty spots', () => {
      expect(store.spotEntities()).toEqual([]);
    });

    it('should start with empty passages', () => {
      expect(store.passageEntities()).toEqual([]);
    });

    it('should start with no selection', () => {
      expect(store.selectedSpotId()).toBeNull();
      expect(store.selectedPassageId()).toBeNull();
      expect(store.passageSourceSpotId()).toBeNull();
    });

    it('should start in select mode', () => {
      expect(store.editingMode()).toBe('select');
    });

    it('should start with grid snap enabled', () => {
      expect(store.gridSnapEnabled()).toBe(true);
    });
  });

  // ==========================================================================
  // Spot Operations
  // ==========================================================================

  describe('addSpot', () => {
    it('should add a spot to the store', () => {
      const spot = createSpot({ id: '1', x: 100, y: 200 });

      store.addSpot(spot);

      expect(store.spotEntities()).toContainEqual(spot);
      expect(store.spotCount()).toBe(1);
    });

    it('should add multiple spots', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 200 });
      const spot2 = createSpot({ id: '2', x: 300, y: 400 });

      store.addSpot(spot1);
      store.addSpot(spot2);

      expect(store.spotCount()).toBe(2);
    });
  });

  describe('updateSpot', () => {
    it('should update an existing spot', () => {
      const spot = createSpot({ id: '1', x: 100, y: 200, name: 'Original' });
      store.addSpot(spot);

      store.updateSpot('1', { name: 'Updated', x: 150 });

      const updated = store.spotEntities().find((s) => s.id === '1');
      expect(updated?.name).toBe('Updated');
      expect(updated?.x).toBe(150);
      expect(updated?.y).toBe(200); // unchanged
    });

    it('should not affect other spots', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);

      store.updateSpot('1', { x: 999 });

      const unchanged = store.spotEntities().find((s) => s.id === '2');
      expect(unchanged?.x).toBe(200);
    });
  });

  describe('deleteSpot', () => {
    it('should remove a spot', () => {
      const spot = createSpot({ id: '1', x: 100, y: 200 });
      store.addSpot(spot);

      store.deleteSpot('1');

      expect(store.spotEntities()).toEqual([]);
      expect(store.spotCount()).toBe(0);
    });

    it('should also remove passages connected to the deleted spot', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });

      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      store.deleteSpot('1');

      expect(store.passageEntities()).toEqual([]);
    });

    it('should clear selection if deleted spot was selected', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);
      store.selectSpot('1');

      store.deleteSpot('1');

      expect(store.selectedSpotId()).toBeNull();
    });
  });

  describe('selectSpot', () => {
    it('should set selectedSpotId', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);

      store.selectSpot('1');

      expect(store.selectedSpotId()).toBe('1');
    });

    it('should clear passage selection when selecting a spot', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      store.selectPassage('p1');

      store.selectSpot('1');

      expect(store.selectedPassageId()).toBeNull();
    });

    it('should allow deselecting by passing null', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);
      store.selectSpot('1');

      store.selectSpot(null);

      expect(store.selectedSpotId()).toBeNull();
    });
  });

  // ==========================================================================
  // Passage Operations
  // ==========================================================================

  describe('addPassage', () => {
    it('should add a passage', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });

      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      expect(store.passageEntities()).toContainEqual(passage);
      expect(store.passageCount()).toBe(1);
    });

    it('should not add passage if spots do not exist', () => {
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });

      store.addPassage(passage);

      expect(store.passageEntities()).toEqual([]);
    });

    it('should not add duplicate passage between same spots', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);

      const passage1 = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      const passage2 = createPassage({ id: 'p2', fromSpotId: '1', toSpotId: '2' });

      store.addPassage(passage1);
      store.addPassage(passage2);

      expect(store.passageCount()).toBe(1);
    });

    it('should not add duplicate passage in reverse direction (bidirectional)', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);

      const passage1 = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      const passage2 = createPassage({ id: 'p2', fromSpotId: '2', toSpotId: '1' }); // reverse

      store.addPassage(passage1);
      store.addPassage(passage2);

      expect(store.passageCount()).toBe(1);
    });
  });

  describe('updatePassage', () => {
    it('should update passage movement cost', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2', movementCost: 1 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      store.updatePassage('p1', { movementCost: 5 });

      const updated = store.passageEntities().find((p) => p.id === 'p1');
      expect(updated?.movementCost).toBe(5);
    });
  });

  describe('deletePassage', () => {
    it('should remove a passage', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      store.deletePassage('p1');

      expect(store.passageEntities()).toEqual([]);
    });

    it('should clear selection if deleted passage was selected', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      store.selectPassage('p1');

      store.deletePassage('p1');

      expect(store.selectedPassageId()).toBeNull();
    });
  });

  describe('selectPassage', () => {
    it('should set selectedPassageId', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      store.selectPassage('p1');

      expect(store.selectedPassageId()).toBe('p1');
    });

    it('should clear spot selection when selecting a passage', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      store.selectSpot('1');

      store.selectPassage('p1');

      expect(store.selectedSpotId()).toBeNull();
    });
  });

  // ==========================================================================
  // Editing Mode
  // ==========================================================================

  describe('setEditingMode', () => {
    it('should change editing mode', () => {
      store.setEditingMode('add-spot');
      expect(store.editingMode()).toBe('add-spot');

      store.setEditingMode('add-passage');
      expect(store.editingMode()).toBe('add-passage');
    });

    it('should clear passageSourceSpotId when switching modes', () => {
      store.setEditingMode('add-passage');
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);
      store.setPassageSource('1');

      store.setEditingMode('select');

      expect(store.passageSourceSpotId()).toBeNull();
    });
  });

  describe('setPassageSource', () => {
    it('should set passageSourceSpotId', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);

      store.setPassageSource('1');

      expect(store.passageSourceSpotId()).toBe('1');
    });
  });

  describe('toggleGridSnap', () => {
    it('should toggle grid snap', () => {
      expect(store.gridSnapEnabled()).toBe(true);

      store.toggleGridSnap();
      expect(store.gridSnapEnabled()).toBe(false);

      store.toggleGridSnap();
      expect(store.gridSnapEnabled()).toBe(true);
    });
  });

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  describe('selectedSpot (computed)', () => {
    it('should return the selected spot entity', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100, name: 'Test' });
      store.addSpot(spot);
      store.selectSpot('1');

      expect(store.selectedSpot()).toEqual(spot);
    });

    it('should return undefined if nothing selected', () => {
      expect(store.selectedSpot()).toBeUndefined();
    });
  });

  describe('selectedPassage (computed)', () => {
    it('should return the selected passage entity', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      store.selectPassage('p1');

      expect(store.selectedPassage()).toEqual(passage);
    });
  });

  describe('passagesForSpot', () => {
    it('should return all passages connected to a spot', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const spot3 = createSpot({ id: '3', x: 300, y: 300 });
      const passage1 = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      const passage2 = createPassage({ id: 'p2', fromSpotId: '1', toSpotId: '3' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addSpot(spot3);
      store.addPassage(passage1);
      store.addPassage(passage2);

      const passages = store.passagesForSpot('1');

      expect(passages).toHaveLength(2);
      expect(passages).toContainEqual(passage1);
      expect(passages).toContainEqual(passage2);
    });
  });

  // ==========================================================================
  // Graph Validation
  // ==========================================================================

  describe('isSpotConnected', () => {
    it('should return true for a spot with passages', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      expect(store.isSpotConnected('1')).toBe(true);
      expect(store.isSpotConnected('2')).toBe(true);
    });

    it('should return false for an isolated spot', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      // No passage connecting them

      expect(store.isSpotConnected('1')).toBe(false);
      expect(store.isSpotConnected('2')).toBe(false);
    });

    it('should return true for a single spot (edge case)', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);

      // Single spot is considered "connected" (no isolation possible)
      expect(store.isSpotConnected('1')).toBe(true);
    });
  });

  describe('isolatedSpots (computed)', () => {
    it('should return empty array when all spots are connected', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);

      expect(store.isolatedSpots()).toEqual([]);
    });

    it('should return isolated spots', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const spot3 = createSpot({ id: '3', x: 300, y: 300 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addSpot(spot3); // isolated
      store.addPassage(passage);

      expect(store.isolatedSpots()).toContainEqual(spot3);
    });
  });

  describe('allSpotsConnected (computed)', () => {
    it('should return true when board is empty', () => {
      expect(store.allSpotsConnected()).toBe(true);
    });

    it('should return true for single spot', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);

      expect(store.allSpotsConnected()).toBe(true);
    });

    it('should return true when all spots form connected graph', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const spot3 = createSpot({ id: '3', x: 300, y: 300 });
      const passage1 = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      const passage2 = createPassage({ id: 'p2', fromSpotId: '2', toSpotId: '3' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addSpot(spot3);
      store.addPassage(passage1);
      store.addPassage(passage2);

      expect(store.allSpotsConnected()).toBe(true);
    });

    it('should return false when there are isolated spots', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const spot3 = createSpot({ id: '3', x: 300, y: 300 }); // isolated
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addSpot(spot3);
      store.addPassage(passage);

      expect(store.allSpotsConnected()).toBe(false);
    });

    it('should return false when graph has multiple components', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const spot3 = createSpot({ id: '3', x: 300, y: 300 });
      const spot4 = createSpot({ id: '4', x: 400, y: 400 });
      const passage1 = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      const passage2 = createPassage({ id: 'p2', fromSpotId: '3', toSpotId: '4' });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addSpot(spot3);
      store.addSpot(spot4);
      store.addPassage(passage1);
      store.addPassage(passage2);

      // Two separate components: (1,2) and (3,4)
      expect(store.allSpotsConnected()).toBe(false);
    });
  });

  // ==========================================================================
  // Reset
  // ==========================================================================

  describe('reset', () => {
    it('should clear all state', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });
      store.addSpot(spot);
      store.addSpot(spot2);
      store.addPassage(passage);
      store.selectSpot('1');
      store.setEditingMode('add-spot');

      store.reset();

      expect(store.spotEntities()).toEqual([]);
      expect(store.passageEntities()).toEqual([]);
      expect(store.selectedSpotId()).toBeNull();
      expect(store.editingMode()).toBe('select');
    });
  });
});
