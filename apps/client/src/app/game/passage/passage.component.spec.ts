import { describe, it, expect, beforeEach } from 'vitest';
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
    passageType: 'normal',
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

    it('should apply normal type class', () => {
      const line = fixture.nativeElement.querySelector('line');
      expect(line.classList.contains('passage--normal')).toBe(true);
    });
  });

  describe('passage type styling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('fromSpot', fromSpot);
      fixture.componentRef.setInput('toSpot', toSpot);
    });

    it('should apply water type class', () => {
      const waterPassage = createPassage({
        id: 'water-1',
        fromSpotId: 'from-1',
        toSpotId: 'to-1',
        passageType: 'water',
      });
      fixture.componentRef.setInput('passage', waterPassage);
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('line');
      expect(line.classList.contains('passage--water')).toBe(true);
    });

    it('should apply fire type class', () => {
      const firePassage = createPassage({
        id: 'fire-1',
        fromSpotId: 'from-1',
        toSpotId: 'to-1',
        passageType: 'fire',
      });
      fixture.componentRef.setInput('passage', firePassage);
      fixture.detectChanges();

      const line = fixture.nativeElement.querySelector('line');
      expect(line.classList.contains('passage--fire')).toBe(true);
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
  });
});
