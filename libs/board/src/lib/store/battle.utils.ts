import { Pokemon, PokemonType, getSpecies } from '../models/board.models';
import { BattleResult } from './game.types';

/**
 * Calculate type advantage bonus
 * Fire > Grass, Water > Fire, Grass > Water
 */
export function getTypeAdvantageBonus(
  attackerType: PokemonType,
  defenderType: PokemonType,
): number {
  if (attackerType === 'fire' && defenderType === 'grass') return 1;
  if (attackerType === 'water' && defenderType === 'fire') return 1;
  if (attackerType === 'grass' && defenderType === 'water') return 1;
  return 0;
}

/**
 * Roll a dice (1-6)
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Execute a battle between two Pokemon
 * @param attacker - The attacking Pokemon
 * @param defender - The defending Pokemon
 * @param defenderOnFlagSpot - true if defender is on a flag spot (normal types get +1)
 */
export function executeBattle(
  attacker: Pokemon,
  defender: Pokemon,
  defenderOnFlagSpot: boolean,
): BattleResult {
  const attackerSpecies = getSpecies(attacker.speciesId);
  const defenderSpecies = getSpecies(defender.speciesId);

  const attackerRoll = rollDice();
  const defenderRoll = rollDice();

  const attackerBonus = getTypeAdvantageBonus(
    attackerSpecies?.type ?? 'normal',
    defenderSpecies?.type ?? 'normal',
  );

  // Defender gets type advantage + flag spot bonus for normal types
  let defenderBonus = getTypeAdvantageBonus(
    defenderSpecies?.type ?? 'normal',
    attackerSpecies?.type ?? 'normal',
  );

  // Normal-type Pokemon get +1 when defending on Flag spot
  if (defenderOnFlagSpot && defenderSpecies?.type === 'normal') {
    defenderBonus += 1;
  }

  const attackerTotal = attackerRoll + attackerBonus;
  const defenderTotal = defenderRoll + defenderBonus;

  // Defender wins ties
  const attackerWins = attackerTotal > defenderTotal;

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerRoll,
    defenderRoll,
    attackerBonus,
    defenderBonus,
    winnerId: attackerWins ? attacker.id : defender.id,
    loserId: attackerWins ? defender.id : attacker.id,
  };
}
