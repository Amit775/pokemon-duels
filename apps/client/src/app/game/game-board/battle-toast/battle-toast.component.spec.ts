import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BattleToastComponent } from './battle-toast.component';
import { BattleResult, Pokemon, createPokemon } from '@pokemon-duel/board';

describe('BattleToastComponent', () => {
  let fixture: ComponentFixture<BattleToastComponent>;
  let component: BattleToastComponent;

  const attacker: Pokemon = createPokemon({ id: 'atk', speciesId: 'charizard', playerId: 1 });
  const defender: Pokemon = createPokemon({ id: 'def', speciesId: 'snorlax', playerId: 2 });

  const battle: BattleResult = {
    attackerId: 'atk',
    defenderId: 'def',
    attackerRoll: 5,
    defenderRoll: 2,
    attackerBonus: 0,
    defenderBonus: 0,
    winnerId: 'atk',
    loserId: 'def',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleToastComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(BattleToastComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('battle', battle);
    fixture.componentRef.setInput('pokemon', [attacker, defender]);
    fixture.detectChanges();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('should render battle header', () => {
      const header = fixture.nativeElement.querySelector('.battle-header');
      expect(header?.textContent).toContain('Battle');
    });

    it('should show attacker name (Charizard)', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Charizard');
    });

    it('should show defender name (Snorlax)', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Snorlax');
    });

    it('should show attacker dice roll', () => {
      const rolls = fixture.nativeElement.querySelectorAll('.battle-dice');
      const rollTexts = Array.from(rolls as NodeListOf<HTMLElement>).map((el) => el.textContent?.trim());
      expect(rollTexts.some((t) => t?.includes('5'))).toBe(true);
    });

    it('should show defender dice roll', () => {
      const rolls = fixture.nativeElement.querySelectorAll('.battle-dice');
      const rollTexts = Array.from(rolls as NodeListOf<HTMLElement>).map((el) => el.textContent?.trim());
      expect(rollTexts.some((t) => t?.includes('2'))).toBe(true);
    });

    it('should show the winner name in result', () => {
      const result = fixture.nativeElement.querySelector('.battle-result');
      expect(result?.textContent).toContain('Charizard');
      expect(result?.textContent).toContain('wins!');
    });

    it('should show VS separator', () => {
      const vs = fixture.nativeElement.querySelector('.battle-vs');
      expect(vs?.textContent?.trim()).toBe('VS');
    });
  });

  // ==========================================================================
  // Bonus display
  // ==========================================================================

  describe('bonus display', () => {
    it('shows bonus when attackerBonus is positive', () => {
      const battleWithBonus: BattleResult = {
        ...battle,
        attackerBonus: 1,
      };
      fixture.componentRef.setInput('battle', battleWithBonus);
      fixture.detectChanges();

      const rolls = fixture.nativeElement.querySelectorAll('.battle-dice');
      const attackerRoll = rolls[0] as HTMLElement;
      expect(attackerRoll.textContent).toContain('+1');
    });
  });

  // ==========================================================================
  // Dismiss
  // ==========================================================================

  describe('dismiss', () => {
    it('emits dismiss when close button is clicked', () => {
      const emitSpy = vi.spyOn(component.dismiss, 'emit');
      const closeBtn = fixture.nativeElement.querySelector('.battle-close') as HTMLElement;
      closeBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
