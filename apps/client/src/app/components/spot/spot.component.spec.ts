import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpotComponent } from './spot.component';
import { Spot, createSpot } from '@pokemon-duel/board';

describe('SpotComponent', () => {
  let component: SpotComponent;
  let fixture: ComponentFixture<SpotComponent>;

  const testSpot: Spot = createSpot({
    id: 'test-1',
    x: 100,
    y: 200,
    name: 'Test Spot',
    metadata: { type: 'normal' },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpotComponent);
    component = fixture.componentInstance;
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('should render spot at correct position', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot') as HTMLElement;
      expect(element).toBeTruthy();
      expect(element.style.left).toBe('100px');
      expect(element.style.top).toBe('200px');
    });

    it('should display spot name', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector('.spot-name');
      expect(nameElement?.textContent?.trim()).toBe('Test Spot');
    });

    it('should apply normal type class by default', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--normal')).toBe(true);
    });

    it('should apply start type class', () => {
      const startSpot = createSpot({
        ...testSpot,
        metadata: { type: 'start' },
      });
      fixture.componentRef.setInput('spot', startSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--start')).toBe(true);
    });

    it('should apply end type class', () => {
      const endSpot = createSpot({
        ...testSpot,
        metadata: { type: 'end' },
      });
      fixture.componentRef.setInput('spot', endSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--end')).toBe(true);
    });

    it('should apply warp type class', () => {
      const warpSpot: Spot = {
        ...testSpot,
        metadata: { type: 'warp', targetSpotId: 'target-1' },
      };
      fixture.componentRef.setInput('spot', warpSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--warp')).toBe(true);
    });
  });

  // ==========================================================================
  // Selection State
  // ==========================================================================

  describe('selection state', () => {
    it('should not have selected class by default', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--selected')).toBe(false);
    });

    it('should apply selected class when selected input is true', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.componentRef.setInput('selected', true);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('.spot');
      expect(element.classList.contains('spot--selected')).toBe(true);
    });
  });

  // ==========================================================================
  // Events
  // ==========================================================================

  describe('events', () => {
    it('should emit spotClicked when clicked', () => {
      fixture.componentRef.setInput('spot', testSpot);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.spotClicked, 'emit');
      const element = fixture.nativeElement.querySelector('.spot');
      element.click();

      expect(emitSpy).toHaveBeenCalledWith(testSpot);
    });

    it('should emit spotClicked with correct spot data', () => {
      const customSpot = createSpot({
        id: 'custom-id',
        x: 50,
        y: 75,
        name: 'Custom',
      });
      fixture.componentRef.setInput('spot', customSpot);
      fixture.detectChanges();

      let emittedSpot: Spot | undefined;
      component.spotClicked.subscribe((spot) => {
        emittedSpot = spot;
      });

      const element = fixture.nativeElement.querySelector('.spot');
      element.click();

      expect(emittedSpot).toEqual(customSpot);
    });
  });
});
