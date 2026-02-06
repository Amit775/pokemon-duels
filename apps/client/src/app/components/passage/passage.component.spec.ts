import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassageComponent } from './passage.component';
import { Spot, Passage, createSpot, createPassage } from '@pokemon-duel/board';

describe('PassageComponent', () => {
  let component: PassageComponent;
  let fixture: ComponentFixture<PassageComponent>;

  const fromSpot: Spot = createSpot({
    id: 'from-1',
    x: 100,
    y: 100,
    name: 'From',
  });

  const toSpot: Spot = createSpot({
    id: 'to-1',
    x: 300,
    y: 200,
    name: 'To',
  });

  const testPassage: Passage = createPassage({
    id: 'passage-1',
    fromSpotId: 'from-1',
    toSpotId: 'to-1',
    movementCost: 1,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassageComponent);
    component = fixture.componentInstance;
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('passage', testPassage);
      fixture.componentRef.setInput('fromSpot', fromSpot);
      fixture.componentRef.setInput('toSpot', toSpot);
      fixture.detectChanges();
    });

    it('should render SVG line element', () => {
      const line = fixture.nativeElement.querySelector('line');
      expect(line).toBeTruthy();
    });

    it('should set line coordinates from spots', () => {
      const line = fixture.nativeElement.querySelector('line');
      expect(line.getAttribute('x1')).toBe('100');
      expect(line.getAttribute('y1')).toBe('100');
      expect(line.getAttribute('x2')).toBe('300');
      expect(line.getAttribute('y2')).toBe('200');
    });

    it('should display movement cost', () => {
      const costLabel = fixture.nativeElement.querySelector('.passage-cost');
      expect(costLabel?.textContent?.trim()).toBe('1');
    });

    it('should position cost label at midpoint', () => {
      const costLabel = fixture.nativeElement.querySelector('.passage-cost') as HTMLElement;
      // Midpoint of (100,100) to (300,200) is (200, 150)
      expect(costLabel.style.left).toBe('200px');
      expect(costLabel.style.top).toBe('150px');
    });
  });

  describe('movement cost display', () => {
    it('should show higher cost values', () => {
      const highCostPassage = createPassage({
        id: 'high-cost',
        fromSpotId: 'from-1',
        toSpotId: 'to-1',
        movementCost: 5,
      });
      fixture.componentRef.setInput('passage', highCostPassage);
      fixture.componentRef.setInput('fromSpot', fromSpot);
      fixture.componentRef.setInput('toSpot', toSpot);
      fixture.detectChanges();

      const costLabel = fixture.nativeElement.querySelector('.passage-cost');
      expect(costLabel?.textContent?.trim()).toBe('5');
    });
  });

  // ==========================================================================
  // Selection State
  // ==========================================================================

  describe('selection state', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('passage', testPassage);
      fixture.componentRef.setInput('fromSpot', fromSpot);
      fixture.componentRef.setInput('toSpot', toSpot);
    });

    it('should not have selected class by default', () => {
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('line');
      expect(line.classList.contains('passage--selected')).toBe(false);
    });

    it('should apply selected class when selected input is true', () => {
      fixture.componentRef.setInput('selected', true);
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('line');
      expect(line.classList.contains('passage--selected')).toBe(true);
    });
  });

  // ==========================================================================
  // Events
  // ==========================================================================

  describe('events', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('passage', testPassage);
      fixture.componentRef.setInput('fromSpot', fromSpot);
      fixture.componentRef.setInput('toSpot', toSpot);
      fixture.detectChanges();
    });

    it('should emit passageClicked when line is clicked', () => {
      const emitSpy = vi.spyOn(component.passageClicked, 'emit');
      const line = fixture.nativeElement.querySelector('line');
      line.dispatchEvent(new MouseEvent('click'));

      expect(emitSpy).toHaveBeenCalledWith(testPassage);
    });

    it('should emit passageClicked when cost label is clicked', () => {
      const emitSpy = vi.spyOn(component.passageClicked, 'emit');
      const costLabel = fixture.nativeElement.querySelector('.passage-cost');
      costLabel.click();

      expect(emitSpy).toHaveBeenCalledWith(testPassage);
    });
  });
});
