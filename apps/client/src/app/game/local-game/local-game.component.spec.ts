import { describe, it } from 'vitest';

describe('LocalGameComponent', () => {
  it.todo('loads board from localStorage on init');
  it.todo('does not call initializeGame when no board is saved');
  it.todo('moves selected pokemon to a valid target spot on spot click');
  it.todo('ends turn after a successful move');
  it.todo('selects a pokemon when clicking a spot occupied by the current player');
  it.todo('selects a pokemon when clicking it directly');
  it.todo('selects a bench pokemon when clicking it');
  it.todo('skipTurn clears selection, clears battle, and ends turn');
  it.todo('resetGame resets store and sets up pokemon');
  it.todo('battle toast auto-dismisses after 5 seconds');
  it.todo('dismissBattle clears the battle toast immediately');
  it.todo('shows win overlay when phase is ended');
});
