import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTypeAdvantageBonus, getSpotTypeBonus, rollDice, executeBattle } from './battle.utils';
import { Spot, Pokemon } from '../models/board.models';

// ============================================================================
// Fixtures
// ============================================================================

const makeSpot = (partial: Partial<Spot> = {}): Spot => ({
  id: 'spot-1',
  name: '',
  x: 100,
  y: 100,
  metadata: { type: 'normal' },
  ...partial,
});

const makePokemon = (partial: Partial<Pokemon> & Pick<Pokemon, 'id' | 'speciesId' | 'playerId'>): Pokemon => ({
  spotId: null,
  ...partial,
});

// ============================================================================
// getTypeAdvantageBonus
// ============================================================================

describe('getTypeAdvantageBonus', () => {
  it('returns 1 when fire attacks grass', () => {
    expect(getTypeAdvantageBonus('fire', 'grass')).toBe(1);
  });

  it('returns 1 when water attacks fire', () => {
    expect(getTypeAdvantageBonus('water', 'fire')).toBe(1);
  });

  it('returns 1 when grass attacks water', () => {
    expect(getTypeAdvantageBonus('grass', 'water')).toBe(1);
  });

  it('returns 0 when fire attacks water (disadvantage)', () => {
    expect(getTypeAdvantageBonus('fire', 'water')).toBe(0);
  });

  it('returns 0 when water attacks grass (disadvantage)', () => {
    expect(getTypeAdvantageBonus('water', 'grass')).toBe(0);
  });

  it('returns 0 when grass attacks fire (disadvantage)', () => {
    expect(getTypeAdvantageBonus('grass', 'fire')).toBe(0);
  });

  it('returns 0 for same-type matchup', () => {
    expect(getTypeAdvantageBonus('fire', 'fire')).toBe(0);
    expect(getTypeAdvantageBonus('water', 'water')).toBe(0);
    expect(getTypeAdvantageBonus('grass', 'grass')).toBe(0);
  });

  it('returns 0 when normal type attacks anything', () => {
    expect(getTypeAdvantageBonus('normal', 'fire')).toBe(0);
    expect(getTypeAdvantageBonus('normal', 'water')).toBe(0);
    expect(getTypeAdvantageBonus('normal', 'grass')).toBe(0);
    expect(getTypeAdvantageBonus('normal', 'normal')).toBe(0);
  });

  it('returns 0 when anything attacks normal type', () => {
    expect(getTypeAdvantageBonus('fire', 'normal')).toBe(0);
    expect(getTypeAdvantageBonus('water', 'normal')).toBe(0);
    expect(getTypeAdvantageBonus('grass', 'normal')).toBe(0);
  });
});

// ============================================================================
// getSpotTypeBonus
// ============================================================================

describe('getSpotTypeBonus', () => {
  it('returns 1 when pokemon type matches spot bonusType', () => {
    const spot = makeSpot({ bonusType: 'fire' });
    expect(getSpotTypeBonus('fire', spot)).toBe(1);
  });

  it('returns 0 when pokemon type does not match spot bonusType', () => {
    const spot = makeSpot({ bonusType: 'water' });
    expect(getSpotTypeBonus('fire', spot)).toBe(0);
  });

  it('returns 0 when spot has no bonusType', () => {
    const spot = makeSpot({ bonusType: undefined });
    expect(getSpotTypeBonus('fire', spot)).toBe(0);
  });

  it('returns 1 for each matching type', () => {
    expect(getSpotTypeBonus('water', makeSpot({ bonusType: 'water' }))).toBe(1);
    expect(getSpotTypeBonus('grass', makeSpot({ bonusType: 'grass' }))).toBe(1);
    expect(getSpotTypeBonus('normal', makeSpot({ bonusType: 'normal' }))).toBe(1);
  });
});

// ============================================================================
// rollDice
// ============================================================================

describe('rollDice', () => {
  it('always returns an integer between 1 and 6 inclusive', () => {
    for (let i = 0; i < 200; i++) {
      const result = rollDice();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});

// ============================================================================
// executeBattle
// ============================================================================

describe('executeBattle', () => {
  const attacker = makePokemon({ id: 'attacker', speciesId: 'charizard', playerId: 1 });
  const defender = makePokemon({ id: 'defender', speciesId: 'venusaur', playerId: 2 });
  const neutralSpot = makeSpot();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('attacker wins when attacker total is higher', () => {
    // charizard=fire vs venusaur=grass: attacker gets +1 type bonus
    // Roll: attacker 4, defender 4 → totals 5 vs 4 → attacker wins
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(3 / 6) // attacker roll → 4
      .mockReturnValueOnce(3 / 6); // defender roll → 4

    const result = executeBattle(attacker, defender, neutralSpot);

    expect(result.winnerId).toBe('attacker');
    expect(result.loserId).toBe('defender');
    expect(result.attackerRoll).toBe(4);
    expect(result.defenderRoll).toBe(4);
    expect(result.attackerBonus).toBe(1); // fire > grass
    expect(result.defenderBonus).toBe(0); // grass not > fire
  });

  it('defender wins on tie (equal totals)', () => {
    // Roll: attacker 3, defender 4 with no bonuses → defender wins
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(2 / 6) // attacker roll → 3
      .mockReturnValueOnce(3 / 6); // defender roll → 4

    const snorlax = makePokemon({ id: 'snorlax', speciesId: 'snorlax', playerId: 1 });
    const snorlax2 = makePokemon({ id: 'snorlax2', speciesId: 'snorlax', playerId: 2 });

    // Both normal type, neutral spot → no bonuses. Attacker 3 vs defender 4 → defender wins.
    const result = executeBattle(snorlax, snorlax2, neutralSpot);

    expect(result.winnerId).toBe('snorlax2');
    expect(result.loserId).toBe('snorlax');
  });

  it('defender wins when totals are exactly equal (tie rule)', () => {
    // Roll same for both, no bonuses → tie → defender wins
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(2 / 6) // attacker roll → 3
      .mockReturnValueOnce(2 / 6); // defender roll → 3

    const snorlax = makePokemon({ id: 'snorlax', speciesId: 'snorlax', playerId: 1 });
    const snorlax2 = makePokemon({ id: 'snorlax2', speciesId: 'snorlax', playerId: 2 });

    const result = executeBattle(snorlax, snorlax2, neutralSpot);

    expect(result.winnerId).toBe('snorlax2');
    expect(result.loserId).toBe('snorlax');
  });

  it('applies spot bonus to matching pokemon type', () => {
    const fireSpot = makeSpot({ bonusType: 'fire' });
    // charizard=fire gets +1 spot bonus on fire spot
    // Roll: attacker 1, defender 6 → without bonus: 1+1=2 vs 6 → defender wins
    // With spot bonus: attacker 1+1(type)+1(spot)=3 vs defender 6 → still defender wins
    // So let's pick values where spot bonus makes the difference:
    // Roll: attacker 4, defender 4 → attacker total = 4+1(type)+1(spot)=6, defender=4 → attacker wins
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(3 / 6) // attacker → 4
      .mockReturnValueOnce(3 / 6); // defender → 4

    const result = executeBattle(attacker, defender, fireSpot);

    expect(result.attackerBonus).toBe(2); // fire>grass (+1) + fire spot (+1)
    expect(result.defenderBonus).toBe(0);
    expect(result.winnerId).toBe('attacker');
  });

  it('returns correct BattleResult shape with all fields', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0) // attacker roll → 1
      .mockReturnValueOnce(5 / 6); // defender roll → 6

    const result = executeBattle(attacker, defender, neutralSpot);

    expect(result).toHaveProperty('attackerId', 'attacker');
    expect(result).toHaveProperty('defenderId', 'defender');
    expect(result).toHaveProperty('attackerRoll');
    expect(result).toHaveProperty('defenderRoll');
    expect(result).toHaveProperty('attackerBonus');
    expect(result).toHaveProperty('defenderBonus');
    expect(result).toHaveProperty('winnerId');
    expect(result).toHaveProperty('loserId');
  });

  it('uses unknown species as normal type (no species found)', () => {
    const unknown = makePokemon({ id: 'unknown', speciesId: 'missingno', playerId: 1 });
    const unknown2 = makePokemon({ id: 'unknown2', speciesId: 'missingno2', playerId: 2 });

    // Should not throw; unknown species treated as normal
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(5 / 6) // attacker → 6
      .mockReturnValueOnce(0); // defender → 1

    const result = executeBattle(unknown, unknown2, neutralSpot);
    expect(result.attackerBonus).toBe(0);
    expect(result.defenderBonus).toBe(0);
    expect(result.winnerId).toBe('unknown');
  });
});
