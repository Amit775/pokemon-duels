import { Pokemon, PokemonType, Spot, getSpecies } from '../models/board.models';
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
 * Calculate spot type bonus — +1 if Pokemon's type matches the spot's bonusType
 */
export function getSpotTypeBonus(pokemonType: PokemonType, spot: Spot): number {
  return spot.bonusType != null && pokemonType === spot.bonusType ? 1 : 0;
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
 * @param spot - The spot where the battle takes place
 */
export function executeBattle(
  attacker: Pokemon,
  defender: Pokemon,
  spot: Spot,
): BattleResult {
  const attackerSpecies = getSpecies(attacker.speciesId);
  const defenderSpecies = getSpecies(defender.speciesId);

  const attackerType = attackerSpecies?.type ?? 'normal';
  const defenderType = defenderSpecies?.type ?? 'normal';

  const attackerRoll = rollDice();
  const defenderRoll = rollDice();

  const attackerBonus =
    getTypeAdvantageBonus(attackerType, defenderType) + getSpotTypeBonus(attackerType, spot);

  const defenderBonus =
    getTypeAdvantageBonus(defenderType, attackerType) + getSpotTypeBonus(defenderType, spot);

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
