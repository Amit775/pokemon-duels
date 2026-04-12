import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GameStore } from './game.store';
import { Spot, Passage } from '../models/board.models';

// ============================================================================
// Board Fixtures
// ============================================================================

// Standard 5-spot linear board:  p1-flag — p1-entry — normal — p2-entry — p2-flag
const spots: Spot[] = [
  { id: 'p1-flag',  name: 'P1 Flag',  x: 0,   y: 0, metadata: { type: 'flag',  playerId: 1 } },
  { id: 'p1-entry', name: 'P1 Entry', x: 100, y: 0, metadata: { type: 'entry', playerId: 1 } },
  { id: 'normal',   name: 'Normal',   x: 200, y: 0, metadata: { type: 'normal' } },
  { id: 'p2-entry', name: 'P2 Entry', x: 300, y: 0, metadata: { type: 'entry', playerId: 2 } },
  { id: 'p2-flag',  name: 'P2 Flag',  x: 400, y: 0, metadata: { type: 'flag',  playerId: 2 } },
];

const passages: Passage[] = [
  { id: 'f1-e1', fromSpotId: 'p1-flag',  toSpotId: 'p1-entry', passageType: 'normal' },
  { id: 'e1-n',  fromSpotId: 'p1-entry', toSpotId: 'normal',   passageType: 'normal' },
  { id: 'n-e2',  fromSpotId: 'normal',   toSpotId: 'p2-entry', passageType: 'normal' },
  { id: 'e2-f2', fromSpotId: 'p2-entry', toSpotId: 'p2-flag',  passageType: 'normal' },
];

// Minimal 2-spot board: p1-entry — p2-entry  (for quick battle setup)
const battleSpots: Spot[] = [
  { id: 's1', name: 'S1', x: 0,   y: 0, metadata: { type: 'entry', playerId: 1 } },
  { id: 's2', name: 'S2', x: 100, y: 0, metadata: { type: 'entry', playerId: 2 } },
];
const battlePassages: Passage[] = [
  { id: 's1-s2', fromSpotId: 's1', toSpotId: 's2', passageType: 'normal' },
];

// Win condition board: p1-entry directly connected to p2-flag
const winSpots: Spot[] = [
  { id: 'we1',  name: 'Entry', x: 0,   y: 0, metadata: { type: 'entry', playerId: 1 } },
  { id: 'wf2',  name: 'Flag',  x: 100, y: 0, metadata: { type: 'flag',  playerId: 2 } },
];
const winPassages: Passage[] = [
  { id: 'we1-wf2', fromSpotId: 'we1', toSpotId: 'wf2', passageType: 'normal' },
];

// ============================================================================
// Helpers
// ============================================================================

function getPokemon(store: InstanceType<typeof GameStore>, speciesId: string, playerId: number) {
  return store.pokemonEntities().find((p) => p.speciesId === speciesId && p.playerId === playerId);
}

// ============================================================================
// Tests
// ============================================================================

describe('GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GameStore] });
    store = TestBed.inject(GameStore);
    store.initializeGame(spots, passages, 2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // initializeGame
  // ==========================================================================

  describe('initializeGame', () => {
    it('stores spots and passages', () => {
      expect(store.spots()).toHaveLength(5);
      expect(store.passages()).toHaveLength(4);
    });

    it('sets currentPlayerId to 1', () => {
      expect(store.currentPlayerId()).toBe(1);
    });

    it('sets phase to playing', () => {
      expect(store.phase()).toBe('playing');
    });

    it('clears selection and valid targets', () => {
      expect(store.selectedPokemonId()).toBeNull();
      expect(store.validMoveTargets()).toEqual([]);
    });

    it('clears winner and last battle', () => {
      expect(store.winnerId()).toBeNull();
      expect(store.lastBattle()).toBeNull();
    });
  });

  // ==========================================================================
  // addPokemonToBench
  // ==========================================================================

  describe('addPokemonToBench', () => {
    it('adds a pokemon to the bench (spotId null)', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = getPokemon(store, 'snorlax', 1);
      expect(p).toBeDefined();
      expect(p!.spotId).toBeNull();
      expect(p!.playerId).toBe(1);
    });

    it('assigns the given speciesId', () => {
      store.addPokemonToBench('charizard', 2);
      const p = getPokemon(store, 'charizard', 2);
      expect(p!.speciesId).toBe('charizard');
    });

    it('generates a unique id', () => {
      store.addPokemonToBench('snorlax', 1);
      store.addPokemonToBench('snorlax', 1);
      const all = store.pokemonEntities().filter((p) => p.speciesId === 'snorlax' && p.playerId === 1);
      const ids = all.map((p) => p.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  // ==========================================================================
  // setupInitialPokemon
  // ==========================================================================

  describe('setupInitialPokemon', () => {
    beforeEach(() => {
      store.setupInitialPokemon();
    });

    it('gives each player exactly 4 pokemon', () => {
      const p1 = store.pokemonEntities().filter((p) => p.playerId === 1);
      const p2 = store.pokemonEntities().filter((p) => p.playerId === 2);
      expect(p1).toHaveLength(4);
      expect(p2).toHaveLength(4);
    });

    it('places snorlax at each player flag spot', () => {
      const p1snorlax = getPokemon(store, 'snorlax', 1);
      const p2snorlax = getPokemon(store, 'snorlax', 2);
      expect(p1snorlax!.spotId).toBe('p1-flag');
      expect(p2snorlax!.spotId).toBe('p2-flag');
    });

    it('puts bench pokemon on the bench (spotId null)', () => {
      const p1Bench = store.pokemonEntities().filter((p) => p.playerId === 1 && p.spotId === null);
      expect(p1Bench).toHaveLength(3);
    });

    it('includes venusaur, blastoise, and charizard on each bench', () => {
      const p1BenchSpecies = store.pokemonEntities()
        .filter((p) => p.playerId === 1 && p.spotId === null)
        .map((p) => p.speciesId);
      expect(p1BenchSpecies).toContain('venusaur');
      expect(p1BenchSpecies).toContain('blastoise');
      expect(p1BenchSpecies).toContain('charizard');
    });
  });

  // ==========================================================================
  // selectPokemon
  // ==========================================================================

  describe('selectPokemon', () => {
    it('clears selection when called with null', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.selectPokemon(null);
      expect(store.selectedPokemonId()).toBeNull();
      expect(store.validMoveTargets()).toEqual([]);
    });

    it('does nothing when selecting an enemy pokemon', () => {
      store.addPokemonToBench('snorlax', 2); // player 2 pokemon, current player is 1
      const p = store.pokemonEntities()[0];
      store.selectPokemon(p.id);
      expect(store.selectedPokemonId()).toBeNull();
    });

    it('does nothing when game is ended', () => {
      // Force ended phase via a win
      store.resetGame();
      store.initializeGame(winSpots, winPassages, 2);
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'we1');
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'wf2'); // win
      // Now game is ended — selecting should clear
      store.selectPokemon(p.id);
      expect(store.selectedPokemonId()).toBeNull();
    });

    it('clears lastBattle when a new pokemon is selected', () => {
      // Simulate a leftover lastBattle by checking the clear happens
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      expect(store.lastBattle()).toBeNull(); // cleared by selectPokemon
    });

    describe('bench pokemon', () => {
      it('includes the entry spot in valid targets (snorlax movement=1)', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        expect(store.selectedPokemonId()).toBe(p.id);
        expect(store.validMoveTargets()).toContain('p1-entry');
      });

      it('does not include spots beyond entry with movement=1 (all moves spent entering)', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        expect(store.validMoveTargets()).not.toContain('normal');
        expect(store.validMoveTargets()).not.toContain('p1-flag');
      });

      it('reaches spots one hop beyond entry with movement=2 (blastoise)', () => {
        store.addPokemonToBench('blastoise', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        expect(store.validMoveTargets()).toContain('p1-entry');
        expect(store.validMoveTargets()).toContain('p1-flag'); // 1 hop beyond entry
        expect(store.validMoveTargets()).toContain('normal');  // 1 hop beyond entry
      });

      it('reaches spots two hops beyond entry with movement=3 (charizard)', () => {
        store.addPokemonToBench('charizard', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        expect(store.validMoveTargets()).toContain('p1-entry');
        expect(store.validMoveTargets()).toContain('normal');
        expect(store.validMoveTargets()).toContain('p2-entry'); // 2 hops beyond entry
      });

      it('excludes entry spot from targets when blocked by own pokemon', () => {
        // Place own pokemon at entry first
        store.addPokemonToBench('snorlax', 1);
        const first = store.currentPlayerBench()[0];
        store.selectPokemon(first.id);
        store.movePokemon(first.id, 'p1-entry');

        // Add second pokemon — entry is blocked by own pokemon
        store.addPokemonToBench('blastoise', 1);
        const second = store.currentPlayerBench()[0];
        store.selectPokemon(second.id);
        expect(store.validMoveTargets()).not.toContain('p1-entry');
      });
    });

    describe('board pokemon', () => {
      it('includes spots reachable within movement range', () => {
        // Move snorlax from bench to p1-entry
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        store.movePokemon(p.id, 'p1-entry');

        // Re-select: now a board pokemon at p1-entry
        store.selectPokemon(p.id);
        // Snorlax movement=1: can reach p1-flag and normal from p1-entry
        expect(store.validMoveTargets()).toContain('p1-flag');
        expect(store.validMoveTargets()).toContain('normal');
        expect(store.validMoveTargets()).not.toContain('p1-entry'); // start spot excluded
        expect(store.validMoveTargets()).not.toContain('p2-entry'); // 2 hops away
      });

      it('includes enemy-occupied spots (for battle)', () => {
        store.resetGame();
        store.initializeGame(battleSpots, battlePassages, 2);

        store.addPokemonToBench('snorlax', 1);
        store.addPokemonToBench('snorlax', 2);
        const p1 = store.pokemonEntities().find((p) => p.playerId === 1)!;
        const p2 = store.pokemonEntities().find((p) => p.playerId === 2)!;

        // Move p1 to s1
        store.selectPokemon(p1.id);
        store.movePokemon(p1.id, 's1');
        store.endTurn();

        // Move p2 to s2
        store.selectPokemon(p2.id);
        store.movePokemon(p2.id, 's2');
        store.endTurn();

        // Player 1 selects snorlax at s1 — enemy at s2 is a valid target
        store.selectPokemon(p1.id);
        expect(store.validMoveTargets()).toContain('s2');
      });
    });
  });

  // ==========================================================================
  // movePokemon
  // ==========================================================================

  describe('movePokemon', () => {
    it('returns { success: false } for a non-valid target', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      const result = store.movePokemon(p.id, 'p2-flag'); // too far for snorlax
      expect(result.success).toBe(false);
    });

    it('returns { success: false } for an unknown pokemon id', () => {
      const result = store.movePokemon('nonexistent', 'p1-entry');
      expect(result.success).toBe(false);
    });

    describe('simple move (no battle)', () => {
      it('moves pokemon to target spot', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        store.movePokemon(p.id, 'p1-entry');

        const updated = store.pokemonEntityMap()[p.id];
        expect(updated.spotId).toBe('p1-entry');
      });

      it('clears selection after move', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        store.movePokemon(p.id, 'p1-entry');

        expect(store.selectedPokemonId()).toBeNull();
        expect(store.validMoveTargets()).toEqual([]);
      });

      it('returns { success: true } with no battle or win', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        const result = store.movePokemon(p.id, 'p1-entry');

        expect(result.success).toBe(true);
        expect(result.battle).toBeUndefined();
        expect(result.won).toBeUndefined();
      });

      it('does not set lastBattle', () => {
        store.addPokemonToBench('snorlax', 1);
        const p = store.currentPlayerBench()[0];
        store.selectPokemon(p.id);
        store.movePokemon(p.id, 'p1-entry');
        expect(store.lastBattle()).toBeNull();
      });
    });

    describe('battle', () => {
      // Setup: p1 snorlax at s1, p2 snorlax at s2, player 1's turn
      function setupBattle() {
        store.resetGame();
        store.initializeGame(battleSpots, battlePassages, 2);

        store.addPokemonToBench('snorlax', 1);
        store.addPokemonToBench('snorlax', 2);
        const p1 = store.pokemonEntities().find((p) => p.playerId === 1)!;
        const p2 = store.pokemonEntities().find((p) => p.playerId === 2)!;

        store.selectPokemon(p1.id);
        store.movePokemon(p1.id, 's1');
        store.endTurn();

        store.selectPokemon(p2.id);
        store.movePokemon(p2.id, 's2');
        store.endTurn(); // back to player 1

        store.selectPokemon(p1.id); // p1 snorlax at s1, p2 snorlax at s2
        return { p1Id: p1.id, p2Id: p2.id };
      }

      it('stores lastBattle result when battle occurs', () => {
        const { p1Id } = setupBattle();
        store.movePokemon(p1Id, 's2');
        expect(store.lastBattle()).not.toBeNull();
        expect(store.lastBattle()!.attackerId).toBe(p1Id);
      });

      it('returns battle result in move result', () => {
        const { p1Id } = setupBattle();
        const result = store.movePokemon(p1Id, 's2');
        expect(result.success).toBe(true);
        expect(result.battle).toBeDefined();
      });

      it('attacker wins: attacker moves to target, defender sent to bench', () => {
        const { p1Id, p2Id } = setupBattle();
        // Control dice: attacker rolls 6, defender rolls 1 → attacker wins
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(5 / 6) // attacker roll → 6
          .mockReturnValueOnce(0);     // defender roll → 1

        store.movePokemon(p1Id, 's2');

        expect(store.pokemonEntityMap()[p1Id].spotId).toBe('s2');
        expect(store.pokemonEntityMap()[p2Id].spotId).toBeNull(); // sent to bench
      });

      it('defender wins: attacker sent to bench, defender stays', () => {
        const { p1Id, p2Id } = setupBattle();
        // Control dice: attacker rolls 1, defender rolls 6 → defender wins
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0)      // attacker roll → 1
          .mockReturnValueOnce(5 / 6); // defender roll → 6

        store.movePokemon(p1Id, 's2');

        expect(store.pokemonEntityMap()[p1Id].spotId).toBeNull(); // sent to bench
        expect(store.pokemonEntityMap()[p2Id].spotId).toBe('s2'); // stays
      });

      it('sets lastBattle.winnerId and loserId correctly', () => {
        const { p1Id, p2Id } = setupBattle();
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(5 / 6)
          .mockReturnValueOnce(0);

        store.movePokemon(p1Id, 's2');
        expect(store.lastBattle()!.winnerId).toBe(p1Id);
        expect(store.lastBattle()!.loserId).toBe(p2Id);
      });
    });

    describe('win condition', () => {
      function setupWinScenario() {
        store.resetGame();
        store.initializeGame(winSpots, winPassages, 2);
        store.addPokemonToBench('snorlax', 1);
        const p = store.pokemonEntities()[0];
        // Move from bench to entry (costs all 1 move)
        store.selectPokemon(p.id);
        store.movePokemon(p.id, 'we1');
        // Player 2 skips (no pokemon)
        store.endTurn();
        store.endTurn(); // back to player 1
        // Select the board pokemon
        store.selectPokemon(p.id);
        return p.id;
      }

      it('sets phase to ended when pokemon reaches opponent flag', () => {
        const pId = setupWinScenario();
        store.movePokemon(pId, 'wf2');
        expect(store.phase()).toBe('ended');
      });

      it('sets winnerId to the current player', () => {
        const pId = setupWinScenario();
        store.movePokemon(pId, 'wf2');
        expect(store.winnerId()).toBe(1);
      });

      it('returns { success: true, won: true }', () => {
        const pId = setupWinScenario();
        const result = store.movePokemon(pId, 'wf2');
        expect(result.success).toBe(true);
        expect(result.won).toBe(true);
      });

      it('clears selection after win', () => {
        const pId = setupWinScenario();
        store.movePokemon(pId, 'wf2');
        expect(store.selectedPokemonId()).toBeNull();
        expect(store.validMoveTargets()).toEqual([]);
      });
    });
  });

  // ==========================================================================
  // endTurn
  // ==========================================================================

  describe('endTurn', () => {
    it('advances from player 1 to player 2', () => {
      store.endTurn();
      expect(store.currentPlayerId()).toBe(2);
    });

    it('wraps from player 2 back to player 1', () => {
      store.endTurn(); // → 2
      store.endTurn(); // → 1
      expect(store.currentPlayerId()).toBe(1);
    });

    it('clears selection when advancing turn', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.endTurn();
      expect(store.selectedPokemonId()).toBeNull();
      expect(store.validMoveTargets()).toEqual([]);
    });

    it('does nothing when phase is ended', () => {
      // Force ended phase
      store.resetGame();
      store.initializeGame(winSpots, winPassages, 2);
      store.addPokemonToBench('snorlax', 1);
      const p = store.pokemonEntities()[0];
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'we1');
      store.endTurn();
      store.endTurn();
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'wf2'); // win → phase ended
      const playerAfterWin = store.currentPlayerId();
      store.endTurn(); // should be a no-op
      expect(store.currentPlayerId()).toBe(playerAfterWin);
      expect(store.phase()).toBe('ended');
    });
  });

  // ==========================================================================
  // clearSelection / clearBattle / resetGame
  // ==========================================================================

  describe('clearSelection', () => {
    it('clears selectedPokemonId and validMoveTargets', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.clearSelection();
      expect(store.selectedPokemonId()).toBeNull();
      expect(store.validMoveTargets()).toEqual([]);
    });
  });

  describe('clearBattle', () => {
    it('sets lastBattle to null', () => {
      // Set up a battle result via a move
      store.resetGame();
      store.initializeGame(battleSpots, battlePassages, 2);
      store.addPokemonToBench('snorlax', 1);
      store.addPokemonToBench('snorlax', 2);
      const p1 = store.pokemonEntities().find((p) => p.playerId === 1)!;
      const p2 = store.pokemonEntities().find((p) => p.playerId === 2)!;
      store.selectPokemon(p1.id);
      store.movePokemon(p1.id, 's1');
      store.endTurn();
      store.selectPokemon(p2.id);
      store.movePokemon(p2.id, 's2');
      store.endTurn();
      store.selectPokemon(p1.id);
      store.movePokemon(p1.id, 's2'); // triggers battle
      expect(store.lastBattle()).not.toBeNull();

      store.clearBattle();
      expect(store.lastBattle()).toBeNull();
    });
  });

  describe('resetGame', () => {
    it('removes all pokemon', () => {
      store.addPokemonToBench('snorlax', 1);
      store.addPokemonToBench('charizard', 2);
      store.resetGame();
      expect(store.pokemonEntities()).toEqual([]);
    });

    it('resets turn to player 1', () => {
      store.endTurn();
      store.resetGame();
      expect(store.currentPlayerId()).toBe(1);
    });

    it('resets phase to playing', () => {
      store.resetGame();
      expect(store.phase()).toBe('playing');
    });

    it('clears winner and selection', () => {
      store.resetGame();
      expect(store.winnerId()).toBeNull();
      expect(store.selectedPokemonId()).toBeNull();
      expect(store.lastBattle()).toBeNull();
    });
  });

  // ==========================================================================
  // Computed signals
  // ==========================================================================

  describe('computed signals', () => {
    it('pokemonOnBoard returns only pokemon with a spotId', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      expect(store.pokemonOnBoard()).toHaveLength(0);
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'p1-entry');
      expect(store.pokemonOnBoard()).toHaveLength(1);
    });

    it('benchPokemon returns only pokemon with null spotId', () => {
      store.addPokemonToBench('snorlax', 1);
      store.addPokemonToBench('charizard', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'p1-entry');
      expect(store.benchPokemon()).toHaveLength(1);
    });

    it('currentPlayerPokemon returns only the current player pokemon', () => {
      store.addPokemonToBench('snorlax', 1);
      store.addPokemonToBench('snorlax', 2);
      expect(store.currentPlayerPokemon()).toHaveLength(1);
      expect(store.currentPlayerPokemon()[0].playerId).toBe(1);
    });

    it('ownOccupiedSpotIds tracks board spots', () => {
      store.addPokemonToBench('snorlax', 1);
      const p = store.currentPlayerBench()[0];
      store.selectPokemon(p.id);
      store.movePokemon(p.id, 'p1-entry');
      expect(store.ownOccupiedSpotIds().has('p1-entry')).toBe(true);
    });

    it('enemyOccupiedSpotIds tracks opponent spots', () => {
      store.addPokemonToBench('snorlax', 2);
      const p2 = store.pokemonEntities()[0];
      store.endTurn(); // switch to player 2
      store.selectPokemon(p2.id);
      store.movePokemon(p2.id, 'p2-entry');
      store.endTurn(); // back to player 1
      expect(store.enemyOccupiedSpotIds().has('p2-entry')).toBe(true);
    });
  });
});
