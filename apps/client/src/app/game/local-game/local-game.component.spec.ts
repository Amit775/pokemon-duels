import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LocalGameComponent } from './local-game.component';
import {
  BoardService,
  GameStore,
  createSpot,
  createPassage,
} from '@pokemon-duel/board';

// Full board with flag + entry spots so setupInitialPokemon works correctly
const testSpots = [
  createSpot({ id: 'p1-flag',  x: 0,   y: 0, name: 'P1 Flag',  metadata: { type: 'flag',  playerId: 1 } }),
  createSpot({ id: 'p1-entry', x: 100, y: 0, name: 'P1 Entry', metadata: { type: 'entry', playerId: 1 } }),
  createSpot({ id: 'p2-entry', x: 300, y: 0, name: 'P2 Entry', metadata: { type: 'entry', playerId: 2 } }),
  createSpot({ id: 'p2-flag',  x: 400, y: 0, name: 'P2 Flag',  metadata: { type: 'flag',  playerId: 2 } }),
];
const testPassages = [
  createPassage({ id: 'f1-e1', fromSpotId: 'p1-flag',  toSpotId: 'p1-entry' }),
  createPassage({ id: 'e1-e2', fromSpotId: 'p1-entry', toSpotId: 'p2-entry' }),
  createPassage({ id: 'e2-f2', fromSpotId: 'p2-entry', toSpotId: 'p2-flag'  }),
];
const testBoard = { id: 'test', name: 'Test Board', spots: testSpots, passages: testPassages };

// Minimal battle board: two adjacent entry spots
const battleSpots = [
  createSpot({ id: 'bs1', x: 0,   y: 0, name: 'S1', metadata: { type: 'entry', playerId: 1 } }),
  createSpot({ id: 'bs2', x: 100, y: 0, name: 'S2', metadata: { type: 'entry', playerId: 2 } }),
];
const battlePassages = [
  createPassage({ id: 'bp1', fromSpotId: 'bs1', toSpotId: 'bs2' }),
];

describe('LocalGameComponent', () => {
  let component: LocalGameComponent;
  let fixture: ComponentFixture<LocalGameComponent>;
  let boardService: BoardService;
  let gameStore: InstanceType<typeof GameStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalGameComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    // Inject boardService and spy BEFORE createComponent so the constructor
    // sees the mock when it calls boardService.loadBoard().
    boardService = TestBed.inject(BoardService);
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(null); // default: no board

    fixture = TestBed.createComponent(LocalGameComponent);
    component = fixture.componentInstance;
    // GameStore is provided at component level — get it from the component injector
    gameStore = fixture.debugElement.injector.get(GameStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Constructor initialization (formerly ngOnInit)
  // ==========================================================================

  describe('constructor initialization', () => {
    it('loads board and initializes game on construction', () => {
      // Override the spy then create a fresh component instance to verify
      // the constructor wires up the board from the service.
      (boardService.loadBoard as ReturnType<typeof vi.spyOn>).mockReturnValue(testBoard);
      const freshFixture = TestBed.createComponent(LocalGameComponent);
      const freshStore = freshFixture.debugElement.injector.get(GameStore);

      expect(freshStore.spots()).toHaveLength(testSpots.length);
      expect(freshStore.passages()).toHaveLength(testPassages.length);
      expect(freshStore.pokemonEntities().length).toBeGreaterThan(0);
    });

    it('does not initialize game when no board is saved', () => {
      // Default spy returns null — component was already created in outer beforeEach
      expect(gameStore.spots()).toEqual([]);
    });
  });

  // ==========================================================================
  // onSpotClicked
  // ==========================================================================

  describe('onSpotClicked', () => {
    beforeEach(() => {
      // Initialize store directly — no need to go through boardService
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('selects a pokemon when clicking a spot occupied by the current player', () => {
      const p1Snorlax = gameStore.pokemonOnBoard().find((p) => p.playerId === 1);
      expect(p1Snorlax).toBeDefined();

      (component as any).onSpotClicked(testSpots[0]); // p1-flag has p1 snorlax

      expect(gameStore.selectedPokemonId()).toBe(p1Snorlax!.id);
    });

    it('moves selected pokemon to a valid target spot on spot click', () => {
      // Select a bench pokemon (charizard, movement=3 can reach p1-entry from bench)
      const charizard = gameStore.benchPokemon().find(
        (p) => p.speciesId === 'charizard' && p.playerId === 1,
      );
      expect(charizard).toBeDefined();
      gameStore.selectPokemon(charizard!.id);
      expect(gameStore.validMoveTargets()).toContain('p1-entry');

      (component as any).onSpotClicked(testSpots[1]); // p1-entry

      expect(gameStore.pokemonEntityMap()[charizard!.id].spotId).toBe('p1-entry');
    });

    it('ends turn after a successful move', () => {
      const charizard = gameStore.benchPokemon().find(
        (p) => p.speciesId === 'charizard' && p.playerId === 1,
      )!;
      gameStore.selectPokemon(charizard.id);

      (component as any).onSpotClicked(testSpots[1]); // p1-entry — valid target

      // Turn should have ended (player 2's turn now)
      expect(gameStore.currentPlayerId()).toBe(2);
    });
  });

  // ==========================================================================
  // onPokemonClicked
  // ==========================================================================

  describe('onPokemonClicked', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('selects a pokemon when clicking it directly', () => {
      const p1Snorlax = gameStore.pokemonOnBoard().find((p) => p.playerId === 1)!;

      (component as any).onPokemonClicked(p1Snorlax);

      expect(gameStore.selectedPokemonId()).toBe(p1Snorlax.id);
    });

    it('does not select enemy pokemon', () => {
      const p2Snorlax = gameStore.pokemonOnBoard().find((p) => p.playerId === 2)!;

      (component as any).onPokemonClicked(p2Snorlax);

      expect(gameStore.selectedPokemonId()).toBeNull();
    });

    it('does not select pokemon when game phase is ended', () => {
      // Force game to ended state
      const winSpots = [
        createSpot({ id: 'we1', x: 0,   y: 0, metadata: { type: 'entry', playerId: 1 } }),
        createSpot({ id: 'wf2', x: 100, y: 0, metadata: { type: 'flag',  playerId: 2 } }),
      ];
      const winPassages = [createPassage({ id: 'wp1', fromSpotId: 'we1', toSpotId: 'wf2' })];
      gameStore.resetGame();
      gameStore.initializeGame(winSpots, winPassages, 2);
      gameStore.addPokemonToBench('charizard', 1);
      const p = gameStore.pokemonEntities()[0];
      gameStore.selectPokemon(p.id);
      gameStore.movePokemon(p.id, 'we1');
      gameStore.endTurn();
      gameStore.endTurn();
      gameStore.selectPokemon(p.id);
      gameStore.movePokemon(p.id, 'wf2'); // game ends

      expect(gameStore.phase()).toBe('ended');

      (component as any).onPokemonClicked(p);

      expect(gameStore.selectedPokemonId()).toBeNull();
    });
  });

  // ==========================================================================
  // onBenchPokemonSelected
  // ==========================================================================

  describe('onBenchPokemonSelected', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('selects a bench pokemon when clicking it', () => {
      const benchPokemon = gameStore.benchPokemon().find((p) => p.playerId === 1)!;

      (component as any).onBenchPokemonSelected(benchPokemon);

      expect(gameStore.selectedPokemonId()).toBe(benchPokemon.id);
    });
  });

  // ==========================================================================
  // skipTurn
  // ==========================================================================

  describe('skipTurn', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('clears selection, clears battle, and ends turn', () => {
      const p1Snorlax = gameStore.pokemonOnBoard().find((p) => p.playerId === 1)!;
      gameStore.selectPokemon(p1Snorlax.id);
      expect(gameStore.selectedPokemonId()).toBe(p1Snorlax.id);

      (component as any).skipTurn();

      expect(gameStore.selectedPokemonId()).toBeNull();
      expect(gameStore.currentPlayerId()).toBe(2);
      expect(gameStore.lastBattle()).toBeNull();
    });
  });

  // ==========================================================================
  // resetGame
  // ==========================================================================

  describe('resetGame', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('resets store and re-sets up pokemon', () => {
      gameStore.endTurn();
      expect(gameStore.currentPlayerId()).toBe(2);

      const resetSpy = vi.spyOn(gameStore, 'resetGame');
      const setupSpy = vi.spyOn(gameStore, 'setupInitialPokemon');

      (component as any).resetGame();

      expect(resetSpy).toHaveBeenCalled();
      expect(setupSpy).toHaveBeenCalled();
    });

    it('returns current player to 1 after reset', () => {
      gameStore.endTurn();

      (component as any).resetGame();

      expect(gameStore.currentPlayerId()).toBe(1);
    });
  });

  // ==========================================================================
  // Battle toast
  // ==========================================================================

  describe('battle toast', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('dismissBattle clears the battle toast immediately', () => {
      // Set showBattle to true directly
      (component as any).showBattle.set(true);
      fixture.detectChanges();

      (component as any).dismissBattle();

      expect((component as any).showBattle()).toBe(false);
      expect(gameStore.lastBattle()).toBeNull();
    });

    it('battle toast auto-dismisses after 5 seconds', async () => {
      vi.useFakeTimers();
      try {
        // Re-initialize with a battle-capable board
        gameStore.resetGame();
        gameStore.initializeGame(battleSpots, battlePassages, 2);
        gameStore.addPokemonToBench('snorlax', 1);
        gameStore.addPokemonToBench('snorlax', 2);
        const p1 = gameStore.pokemonEntities().find((p) => p.playerId === 1)!;
        const p2 = gameStore.pokemonEntities().find((p) => p.playerId === 2)!;

        // Position pokemon adjacent to each other
        gameStore.selectPokemon(p1.id);
        gameStore.movePokemon(p1.id, 'bs1');
        gameStore.endTurn();
        gameStore.selectPokemon(p2.id);
        gameStore.movePokemon(p2.id, 'bs2');
        gameStore.endTurn();

        // Trigger battle (p1 moves into p2's spot)
        gameStore.selectPokemon(p1.id);
        gameStore.movePokemon(p1.id, 'bs2');

        // Effect fires, sets showBattle=true and starts 5s timer
        fixture.detectChanges();
        expect((component as any).showBattle()).toBe(true);

        vi.advanceTimersByTime(5000);

        expect((component as any).showBattle()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ==========================================================================
  // Win overlay
  // ==========================================================================

  describe('win overlay', () => {
    beforeEach(() => {
      gameStore.initializeGame(testSpots, testPassages, 2);
      gameStore.setupInitialPokemon();
      fixture.detectChanges();
    });

    it('shows win overlay when phase is ended', () => {
      const winSpots = [
        createSpot({ id: 'we1', x: 0,   y: 0, metadata: { type: 'entry', playerId: 1 } }),
        createSpot({ id: 'wf2', x: 100, y: 0, metadata: { type: 'flag',  playerId: 2 } }),
      ];
      const winPassages = [createPassage({ id: 'wp1', fromSpotId: 'we1', toSpotId: 'wf2' })];

      gameStore.resetGame();
      gameStore.initializeGame(winSpots, winPassages, 2);
      gameStore.addPokemonToBench('charizard', 1); // movement=3
      const p = gameStore.pokemonEntities()[0];
      gameStore.selectPokemon(p.id);
      gameStore.movePokemon(p.id, 'we1');
      gameStore.endTurn();
      gameStore.endTurn();
      gameStore.selectPokemon(p.id);
      gameStore.movePokemon(p.id, 'wf2'); // win → phase='ended'

      fixture.detectChanges();

      expect(gameStore.phase()).toBe('ended');
      expect(gameStore.winnerId()).toBe(1);
    });
  });
});
