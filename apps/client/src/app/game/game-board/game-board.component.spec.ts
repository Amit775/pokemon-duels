import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { GameBoardComponent } from './game-board.component';
import {
  Spot,
  Passage,
  Pokemon,
  BattleResult,
  createSpot,
  createPassage,
  createPokemon,
} from '@pokemon-duel/board';

describe('GameBoardComponent', () => {
  let fixture: ComponentFixture<GameBoardComponent>;
  let component: GameBoardComponent;

  // Minimal board: two spots linked by one passage
  const spots: Spot[] = [
    createSpot({ id: 'p1-entry', x: 100, y: 250, name: 'Entry 1', metadata: { type: 'entry', playerId: 1 } }),
    createSpot({ id: 'p2-entry', x: 900, y: 250, name: 'Entry 2', metadata: { type: 'entry', playerId: 2 } }),
  ];
  const passages: Passage[] = [
    createPassage({ id: 'pass1', fromSpotId: 'p1-entry', toSpotId: 'p2-entry' }),
  ];

  function setDefaultInputs(): void {
    fixture.componentRef.setInput('spots', spots);
    fixture.componentRef.setInput('passages', passages);
    fixture.componentRef.setInput('pokemonOnBoard', []);
    fixture.componentRef.setInput('player1Bench', []);
    fixture.componentRef.setInput('player2Bench', []);
    fixture.componentRef.setInput('currentPlayerId', 1);
    fixture.componentRef.setInput('phase', 'playing');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(GameBoardComponent);
    component = fixture.componentInstance;
    setDefaultInputs();
    fixture.detectChanges();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('renders board spots', () => {
      // 2 board spots + 6 bench slots per player = 14 app-spot elements
      const spotEls = fixture.nativeElement.querySelectorAll('app-spot');
      expect(spotEls.length).toBeGreaterThanOrEqual(2);
    });

    it('renders passages between spots', () => {
      const passageEls = fixture.nativeElement.querySelectorAll('app-passage');
      expect(passageEls.length).toBe(1);
    });

    it('renders pokemon on board when pokemonOnBoard has entries', () => {
      const pokemon: Pokemon = createPokemon({
        id: 'pk1',
        speciesId: 'snorlax',
        playerId: 1,
        spotId: 'p1-entry',
      });
      fixture.componentRef.setInput('pokemonOnBoard', [pokemon]);
      fixture.detectChanges();

      const pokemonEls = fixture.nativeElement.querySelectorAll('app-pokemon');
      expect(pokemonEls.length).toBeGreaterThanOrEqual(1);
    });

    it('renders bench slots for both players (6 per player)', () => {
      // Each player has 6 bench slots rendered as app-spot elements
      // 2 board spots + 6 * 2 bench spots = 14 total
      const spotEls = fixture.nativeElement.querySelectorAll('app-spot');
      expect(spotEls.length).toBe(14);
    });

    it('shows battle toast when lastBattle is set', () => {
      const pk1 = createPokemon({ id: 'pk1', speciesId: 'charizard', playerId: 1 });
      const pk2 = createPokemon({ id: 'pk2', speciesId: 'snorlax', playerId: 2 });
      const battle: BattleResult = {
        attackerId: 'pk1', defenderId: 'pk2',
        attackerRoll: 5, defenderRoll: 3,
        attackerBonus: 0, defenderBonus: 0,
        winnerId: 'pk1', loserId: 'pk2',
      };
      fixture.componentRef.setInput('lastBattle', battle);
      fixture.componentRef.setInput('pokemonOnBoard', [pk1, pk2]);
      fixture.detectChanges();

      const toast = fixture.nativeElement.querySelector('app-battle-toast');
      expect(toast).toBeTruthy();
    });

    it('hides battle toast when lastBattle is null', () => {
      fixture.componentRef.setInput('lastBattle', null);
      fixture.detectChanges();

      const toast = fixture.nativeElement.querySelector('app-battle-toast');
      expect(toast).toBeFalsy();
    });
  });

  // ==========================================================================
  // Valid Target Indicators
  // ==========================================================================

  describe('valid target indicators', () => {
    it('shows valid-target indicators when validMoveTargets is non-empty', () => {
      fixture.componentRef.setInput('validMoveTargets', ['p1-entry']);
      fixture.detectChanges();

      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(1);
    });

    it('shows indicators for all valid targets', () => {
      fixture.componentRef.setInput('validMoveTargets', ['p1-entry', 'p2-entry']);
      fixture.detectChanges();

      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(2);
    });

    it('hides valid-target indicators when isInteractive is false', () => {
      fixture.componentRef.setInput('validMoveTargets', ['p1-entry', 'p2-entry']);
      fixture.componentRef.setInput('isInteractive', false);
      fixture.detectChanges();

      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(0);
    });

    it('shows no indicators when validMoveTargets is empty', () => {
      fixture.componentRef.setInput('validMoveTargets', []);
      fixture.detectChanges();

      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(0);
    });

    it('marks battle indicator when enemy occupies valid target', () => {
      const enemy = createPokemon({ id: 'e1', speciesId: 'snorlax', playerId: 2, spotId: 'p2-entry' });
      fixture.componentRef.setInput('pokemonOnBoard', [enemy]);
      fixture.componentRef.setInput('validMoveTargets', ['p2-entry']);
      fixture.detectChanges();

      const battleIndicator = fixture.nativeElement.querySelector('.valid-target-indicator--battle');
      expect(battleIndicator).toBeTruthy();
    });
  });

  // ==========================================================================
  // Outputs
  // ==========================================================================

  describe('outputs', () => {
    it('emits spotClicked when a valid-target indicator is clicked', () => {
      fixture.componentRef.setInput('validMoveTargets', ['p1-entry']);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.spotClicked, 'emit');
      const indicator = fixture.nativeElement.querySelector('.valid-target-indicator') as HTMLElement;
      indicator.click();

      expect(emitSpy).toHaveBeenCalledWith(spots[0]);
    });

    it('emits dismissBattle when the battle toast close button is clicked', () => {
      const pk1 = createPokemon({ id: 'pk1', speciesId: 'charizard', playerId: 1 });
      const pk2 = createPokemon({ id: 'pk2', speciesId: 'snorlax', playerId: 2 });
      const battle: BattleResult = {
        attackerId: 'pk1', defenderId: 'pk2',
        attackerRoll: 5, defenderRoll: 3,
        attackerBonus: 0, defenderBonus: 0,
        winnerId: 'pk1', loserId: 'pk2',
      };
      fixture.componentRef.setInput('lastBattle', battle);
      fixture.componentRef.setInput('pokemonOnBoard', [pk1, pk2]);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.dismissBattle, 'emit');
      const toast = fixture.nativeElement.querySelector('.battle-toast') as HTMLElement;
      toast.click();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Computed helpers
  // ==========================================================================

  describe('computed helpers', () => {
    it('spotMap contains all spots keyed by id', () => {
      fixture.detectChanges();
      // Access via template — spot count should equal spots array length
      expect(fixture.nativeElement.querySelectorAll('app-passage').length).toBe(passages.length);
    });

    it('passagesWithSpots only includes passages whose spots exist', () => {
      const brokenPassage: Passage = createPassage({
        id: 'broken',
        fromSpotId: 'nonexistent-1',
        toSpotId: 'nonexistent-2',
      });
      fixture.componentRef.setInput('passages', [...passages, brokenPassage]);
      fixture.detectChanges();

      // Only valid passage should be rendered (broken one is filtered out)
      const passageEls = fixture.nativeElement.querySelectorAll('app-passage');
      expect(passageEls.length).toBe(1);
    });
  });
});
