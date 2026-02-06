import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardCanvasComponent } from './board-canvas.component';
import { BoardStore, createSpot, createPassage } from '@pokemon-duel/board';

describe('BoardCanvasComponent', () => {
  let component: BoardCanvasComponent;
  let fixture: ComponentFixture<BoardCanvasComponent>;
  let store: InstanceType<typeof BoardStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardCanvasComponent],
      providers: [BoardStore],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardCanvasComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(BoardStore);
    fixture.detectChanges();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('should render canvas container', () => {
      const canvas = fixture.nativeElement.querySelector('.board-canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render grid overlay when enabled', () => {
      const grid = fixture.nativeElement.querySelector('.board-canvas__grid');
      expect(grid).toBeTruthy();
    });

    it('should render spots from store', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      fixture.detectChanges();

      const spots = fixture.nativeElement.querySelectorAll('app-spot');
      expect(spots.length).toBe(2);
    });

    it('should render passages from store', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });

      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      fixture.detectChanges();

      const passages = fixture.nativeElement.querySelectorAll('app-passage');
      expect(passages.length).toBe(1);
    });
  });

  // ==========================================================================
  // Spot Interactions
  // ==========================================================================

  describe('spot interactions', () => {
    it('should select spot when clicked in select mode', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);
      store.setEditingMode('select');
      fixture.detectChanges();

      component.onSpotClicked(spot);

      expect(store.selectedSpotId()).toBe('1');
    });

    it('should set passage source when first spot clicked in add-passage mode', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);
      store.setEditingMode('add-passage');
      fixture.detectChanges();

      component.onSpotClicked(spot);

      expect(store.passageSourceSpotId()).toBe('1');
    });

    it('should create passage when second spot clicked in add-passage mode', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.setEditingMode('add-passage');
      fixture.detectChanges();

      component.onSpotClicked(spot1); // Set source
      component.onSpotClicked(spot2); // Complete passage

      expect(store.passageCount()).toBe(1);
      expect(store.passageSourceSpotId()).toBeNull();
    });
  });

  // ==========================================================================
  // Canvas Click (Add Spot)
  // ==========================================================================

  describe('canvas click', () => {
    it('should add spot when canvas clicked in add-spot mode', () => {
      store.setEditingMode('add-spot');
      fixture.detectChanges();

      const clickEvent = new MouseEvent('click', {
        clientX: 150,
        clientY: 200,
      });
      Object.defineProperty(clickEvent, 'offsetX', { value: 150 });
      Object.defineProperty(clickEvent, 'offsetY', { value: 200 });

      component.onCanvasClick(clickEvent);

      expect(store.spotCount()).toBe(1);
    });

    it('should not add spot when not in add-spot mode', () => {
      store.setEditingMode('select');
      fixture.detectChanges();

      const clickEvent = new MouseEvent('click', {
        clientX: 150,
        clientY: 200,
      });
      Object.defineProperty(clickEvent, 'offsetX', { value: 150 });
      Object.defineProperty(clickEvent, 'offsetY', { value: 200 });

      component.onCanvasClick(clickEvent);

      expect(store.spotCount()).toBe(0);
    });

    it('should snap to grid when grid snap is enabled', () => {
      store.setEditingMode('add-spot');
      fixture.detectChanges();

      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'offsetX', { value: 73 });
      Object.defineProperty(clickEvent, 'offsetY', { value: 48 });

      component.onCanvasClick(clickEvent);

      const spot = store.spotEntities()[0];
      // Default cell size is 50, so 73 → 50, 48 → 50
      expect(spot.x).toBe(50);
      expect(spot.y).toBe(50);
    });
  });

  // ==========================================================================
  // Passage Selection
  // ==========================================================================

  describe('passage selection', () => {
    it('should select passage when clicked', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      const passage = createPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2' });

      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage(passage);
      fixture.detectChanges();

      component.onPassageClicked(passage);

      expect(store.selectedPassageId()).toBe('p1');
    });
  });
});
