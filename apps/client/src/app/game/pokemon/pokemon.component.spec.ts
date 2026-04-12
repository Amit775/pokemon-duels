import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PokemonComponent } from './pokemon.component';
import { createPokemon, Pokemon } from '@pokemon-duel/board';

describe('PokemonComponent', () => {
  let fixture: ComponentFixture<PokemonComponent>;
  let component: PokemonComponent;

  const testPokemon: Pokemon = createPokemon({
    id: 'p1',
    speciesId: 'snorlax',
    playerId: 1,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonComponent);
    component = fixture.componentInstance;
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.detectChanges();
    });

    it('should render pokemon image with correct alt text', () => {
      const img = fixture.nativeElement.querySelector('img.pokemon-image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('Snorlax');
    });

    it('should show movement value', () => {
      const movement = fixture.nativeElement.querySelector('.pokemon-movement');
      expect(movement?.textContent?.trim()).toBe('1'); // Snorlax movement = 1
    });

    it('should apply player-1 class for player 1 pokemon', () => {
      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--player-1')).toBe(true);
    });

    it('should apply normal type class for Snorlax', () => {
      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--normal')).toBe(true);
    });

    it('should apply player-2 class for player 2 pokemon', () => {
      const p2Pokemon: Pokemon = createPokemon({ id: 'p2', speciesId: 'charizard', playerId: 2 });
      fixture.componentRef.setInput('pokemon', p2Pokemon);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--player-2')).toBe(true);
    });

    it('should apply fire type class for Charizard', () => {
      const charizard: Pokemon = createPokemon({ id: 'p2', speciesId: 'charizard', playerId: 2 });
      fixture.componentRef.setInput('pokemon', charizard);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--fire')).toBe(true);
    });
  });

  // ==========================================================================
  // Positioning
  // ==========================================================================

  describe('positioning', () => {
    it('uses pixel positions when no percent inputs provided', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.componentRef.setInput('x', 150);
      fixture.componentRef.setInput('y', 75);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon') as HTMLElement;
      expect(el.style.left).toBe('150px');
      expect(el.style.top).toBe('75px');
    });

    it('uses percent positions when xPercent/yPercent are provided', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.componentRef.setInput('xPercent', 25);
      fixture.componentRef.setInput('yPercent', 50);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon') as HTMLElement;
      expect(el.style.left).toBe('25%');
      expect(el.style.top).toBe('50%');
    });

    it('defaults to 0px when no position inputs are provided', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon') as HTMLElement;
      expect(el.style.left).toBe('0px');
      expect(el.style.top).toBe('0px');
    });
  });

  // ==========================================================================
  // Selection State
  // ==========================================================================

  describe('selection state', () => {
    it('should not have selected class by default', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--selected')).toBe(false);
    });

    it('should apply selected class when selected is true', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.componentRef.setInput('selected', true);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--selected')).toBe(true);
    });
  });

  // ==========================================================================
  // Draggable
  // ==========================================================================

  describe('draggable', () => {
    it('should not have draggable class by default', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--draggable')).toBe(false);
    });

    it('should apply draggable class when draggable is true', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.componentRef.setInput('draggable', true);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.pokemon');
      expect(el.classList.contains('pokemon--draggable')).toBe(true);
    });
  });

  // ==========================================================================
  // Click Event
  // ==========================================================================

  describe('click event', () => {
    it('emits pokemonClicked with the pokemon when clicked', () => {
      fixture.componentRef.setInput('pokemon', testPokemon);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.pokemonClicked, 'emit');
      const el = fixture.nativeElement.querySelector('.pokemon') as HTMLElement;
      el.click();

      expect(emitSpy).toHaveBeenCalledWith(testPokemon);
    });

    it('emits the correct pokemon instance when multiple pokemon exist', () => {
      const blastoise: Pokemon = createPokemon({ id: 'b1', speciesId: 'blastoise', playerId: 1 });
      fixture.componentRef.setInput('pokemon', blastoise);
      fixture.detectChanges();

      let emittedPokemon: Pokemon | undefined;
      component.pokemonClicked.subscribe((p) => { emittedPokemon = p; });

      const el = fixture.nativeElement.querySelector('.pokemon') as HTMLElement;
      el.click();

      expect(emittedPokemon).toEqual(blastoise);
    });
  });
});
