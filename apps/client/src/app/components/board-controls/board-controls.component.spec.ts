import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardControlsComponent } from './board-controls.component';
import { BoardStore, BoardService, createSpot, createBoard } from '@pokemon-duel/board';

describe('BoardControlsComponent', () => {
  let component: BoardControlsComponent;
  let fixture: ComponentFixture<BoardControlsComponent>;
  let store: InstanceType<typeof BoardStore>;
  let service: BoardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardControlsComponent],
      providers: [BoardStore, BoardService],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardControlsComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(BoardStore);
    service = TestBed.inject(BoardService);
    fixture.detectChanges();

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('should render mode buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.mode-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render grid toggle button', () => {
      const gridBtn = fixture.nativeElement.querySelector('[data-testid="grid-toggle"]');
      expect(gridBtn).toBeTruthy();
    });

    it('should render validation status', () => {
      const status = fixture.nativeElement.querySelector('.validation-status');
      expect(status).toBeTruthy();
    });
  });

  // ==========================================================================
  // Mode Selection
  // ==========================================================================

  describe('mode selection', () => {
    it('should change to select mode', () => {
      component.setMode('select');
      expect(store.editingMode()).toBe('select');
    });

    it('should change to add-spot mode', () => {
      component.setMode('add-spot');
      expect(store.editingMode()).toBe('add-spot');
    });

    it('should change to add-passage mode', () => {
      component.setMode('add-passage');
      expect(store.editingMode()).toBe('add-passage');
    });

    it('should change to delete mode', () => {
      component.setMode('delete');
      expect(store.editingMode()).toBe('delete');
    });

    it('should highlight active mode button', () => {
      store.setEditingMode('add-spot');
      fixture.detectChanges();

      const activeBtn = fixture.nativeElement.querySelector('.mode-btn--active');
      expect(activeBtn?.textContent).toContain('Add Spot');
    });
  });

  // ==========================================================================
  // Grid Toggle
  // ==========================================================================

  describe('grid toggle', () => {
    it('should toggle grid snap', () => {
      expect(store.gridSnapEnabled()).toBe(true);

      component.toggleGridSnap();
      expect(store.gridSnapEnabled()).toBe(false);

      component.toggleGridSnap();
      expect(store.gridSnapEnabled()).toBe(true);
    });
  });

  // ==========================================================================
  // Validation Status
  // ==========================================================================

  describe('validation status', () => {
    it('should show valid status when all spots connected', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2', passageType: 'normal' });
      fixture.detectChanges();

      const status = fixture.nativeElement.querySelector('.validation-status');
      expect(status.classList.contains('validation-status--valid')).toBe(true);
    });

    it('should show invalid status when spots are isolated', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      // No passage connecting them
      fixture.detectChanges();

      const status = fixture.nativeElement.querySelector('.validation-status');
      expect(status.classList.contains('validation-status--invalid')).toBe(true);
    });
  });

  // ==========================================================================
  // Save/Load
  // ==========================================================================

  describe('save/load', () => {
    it('should save board to localStorage', () => {
      const spot = createSpot({ id: '1', x: 100, y: 100 });
      store.addSpot(spot);

      component.saveBoard();

      const saved = localStorage.getItem('pokemon-board');
      expect(saved).toBeTruthy();
    });

    it('should load board from localStorage', () => {
      const board = createBoard({
        id: 'test',
        name: 'Test',
        spots: [createSpot({ id: '1', x: 100, y: 100 })],
        passages: [],
      });
      localStorage.setItem('pokemon-board', JSON.stringify(board));

      component.loadBoard();

      expect(store.spotCount()).toBe(1);
    });
  });

  // ==========================================================================
  // Clear Board
  // ==========================================================================

  describe('clear board', () => {
    it('should clear all spots and passages', () => {
      const spot1 = createSpot({ id: '1', x: 100, y: 100 });
      const spot2 = createSpot({ id: '2', x: 200, y: 200 });
      store.addSpot(spot1);
      store.addSpot(spot2);
      store.addPassage({ id: 'p1', fromSpotId: '1', toSpotId: '2', passageType: 'normal' });

      component.clearBoard();

      expect(store.spotCount()).toBe(0);
      expect(store.passageCount()).toBe(0);
    });
  });
});
