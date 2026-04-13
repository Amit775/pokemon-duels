import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MultiplayerGameComponent } from './multiplayer-game.component';
import { MultiplayerService } from '../../multiplayer/multiplayer.service';
import { MultiplayerStore } from '../../multiplayer/multiplayer.store';
import { MultiplayerGameState } from '../../multiplayer/multiplayer.types';
import { createSpot, createPokemon } from '@pokemon-duel/board';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class LobbyStubComponent {}


// ============================================================================
// Helpers
// ============================================================================

const makeGameState = (overrides: Partial<MultiplayerGameState> = {}): MultiplayerGameState => ({
  currentPlayerId: 1,
  playerCount: 2,
  phase: 'playing',
  winnerId: null,
  lastBattle: null,
  selectedPokemonId: null,
  validMoveTargets: [],
  spots: [],
  passages: [],
  pokemon: [],
  ...overrides,
});

// ============================================================================
// MultiplayerGameComponent
// ============================================================================

describe('MultiplayerGameComponent', () => {
  let fixture: ComponentFixture<MultiplayerGameComponent>;
  let component: MultiplayerGameComponent;
  let store: InstanceType<typeof MultiplayerStore>;
  let router: Router;

  const mockMultiplayerService = {
    joinRoom: vi.fn().mockResolvedValue(undefined),
    leaveRoom: vi.fn(),
    selectPokemon: vi.fn().mockResolvedValue(undefined),
    movePokemon: vi.fn().mockResolvedValue(undefined),
  };

  const mockActivatedRoute = {
    snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MultiplayerGameComponent],
      providers: [
        provideRouter([{ path: 'lobby', component: LobbyStubComponent }]),
        provideNoopAnimations(),
        { provide: MultiplayerService, useValue: mockMultiplayerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    store = TestBed.inject(MultiplayerStore);
    store.reset();
    // Set roomState to non-idle so the roomStateEffect doesn't immediately navigate to /lobby
    store.setRoomState('playing');
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(MultiplayerGameComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // ngOnInit
  // ==========================================================================

  describe('ngOnInit', () => {
    it('does not call joinRoom when no roomId in route params', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
      fixture.detectChanges();
      expect(mockMultiplayerService.joinRoom).not.toHaveBeenCalled();
    });

    it('does not call joinRoom when already in a room', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('ABCD');
      store.setRoomInfo({ roomId: 'ABCD', playerCount: 1, players: [], state: 'waiting' });
      fixture.detectChanges();
      expect(mockMultiplayerService.joinRoom).not.toHaveBeenCalled();
    });

    it('calls joinRoom with roomId when param present and not in room', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('ABCD');
      fixture.detectChanges();
      expect(mockMultiplayerService.joinRoom).toHaveBeenCalledWith('ABCD');
    });
  });

  // ==========================================================================
  // roomState effect (navigates to lobby when idle)
  // ==========================================================================

  describe('roomState effect', () => {
    it('navigates to /lobby when roomState becomes idle', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      store.setRoomState('playing');
      fixture.detectChanges();

      store.setRoomState('idle');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith(['/lobby']);
    });
  });

  // ==========================================================================
  // onSpotClicked
  // ==========================================================================

  describe('onSpotClicked', () => {
    const spot = createSpot({ id: 'spot1', x: 0, y: 0, metadata: { type: 'entry', playerId: 1 } });

    beforeEach(() => {
      store.setLocalPlayerId(1);
      store.setRoomState('playing');
      fixture.detectChanges();
    });

    it('does nothing when isMyTurn is false', async () => {
      store.setGameState(makeGameState({ currentPlayerId: 2, phase: 'playing' }));
      fixture.detectChanges();

      await (component as any).onSpotClicked(spot);

      expect(mockMultiplayerService.movePokemon).not.toHaveBeenCalled();
      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });

    it('calls movePokemon when a pokemon is selected and spot is a valid target', async () => {
      store.setGameState(makeGameState({
        currentPlayerId: 1,
        selectedPokemonId: 'pk1',
        validMoveTargets: ['spot1'],
      }));
      fixture.detectChanges();

      await (component as any).onSpotClicked(spot);

      expect(mockMultiplayerService.movePokemon).toHaveBeenCalledWith('pk1', 'spot1');
    });

    it('calls selectPokemon when clicking a spot occupied by my pokemon', async () => {
      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'snorlax', playerId: 1, spotId: 'spot1' });
      store.setGameState(makeGameState({
        currentPlayerId: 1,
        pokemon: [myPokemon],
        validMoveTargets: [],
      }));
      fixture.detectChanges();

      await (component as any).onSpotClicked(spot);

      expect(mockMultiplayerService.selectPokemon).toHaveBeenCalledWith('pk1');
    });

    it('does not call selectPokemon when clicking a spot occupied by enemy pokemon', async () => {
      const enemyPokemon = createPokemon({ id: 'pk2', speciesId: 'snorlax', playerId: 2, spotId: 'spot1' });
      store.setGameState(makeGameState({
        currentPlayerId: 1,
        pokemon: [enemyPokemon],
        validMoveTargets: [],
      }));
      fixture.detectChanges();

      await (component as any).onSpotClicked(spot);

      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onPokemonClicked
  // ==========================================================================

  describe('onPokemonClicked', () => {
    beforeEach(() => {
      store.setLocalPlayerId(1);
      store.setRoomState('playing');
      store.setGameState(makeGameState({ currentPlayerId: 1, phase: 'playing' }));
      fixture.detectChanges();
    });

    it('does nothing when isMyTurn is false', async () => {
      store.setGameState(makeGameState({ currentPlayerId: 2, phase: 'playing' }));
      fixture.detectChanges();

      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'snorlax', playerId: 1 });
      await (component as any).onPokemonClicked(myPokemon);

      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });

    it('calls selectPokemon when clicking my pokemon', async () => {
      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'snorlax', playerId: 1 });
      await (component as any).onPokemonClicked(myPokemon);

      expect(mockMultiplayerService.selectPokemon).toHaveBeenCalledWith('pk1');
    });

    it('does not select enemy pokemon', async () => {
      const enemyPokemon = createPokemon({ id: 'pk2', speciesId: 'snorlax', playerId: 2 });
      await (component as any).onPokemonClicked(enemyPokemon);

      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });

    it('does not select pokemon when phase is ended', async () => {
      store.setGameState(makeGameState({ currentPlayerId: 1, phase: 'ended' }));
      fixture.detectChanges();

      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'snorlax', playerId: 1 });
      await (component as any).onPokemonClicked(myPokemon);

      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onBenchPokemonSelected
  // ==========================================================================

  describe('onBenchPokemonSelected', () => {
    beforeEach(() => {
      store.setLocalPlayerId(1);
      store.setRoomState('playing');
      store.setGameState(makeGameState({ currentPlayerId: 1, phase: 'playing' }));
      fixture.detectChanges();
    });

    it('calls selectPokemon for my bench pokemon', async () => {
      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'charizard', playerId: 1 });
      await (component as any).onBenchPokemonSelected(myPokemon);

      expect(mockMultiplayerService.selectPokemon).toHaveBeenCalledWith('pk1');
    });

    it('does nothing when not my turn', async () => {
      store.setGameState(makeGameState({ currentPlayerId: 2, phase: 'playing' }));
      fixture.detectChanges();

      const myPokemon = createPokemon({ id: 'pk1', speciesId: 'charizard', playerId: 1 });
      await (component as any).onBenchPokemonSelected(myPokemon);

      expect(mockMultiplayerService.selectPokemon).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // skipTurn
  // ==========================================================================

  describe('skipTurn', () => {
    it('calls selectPokemon with null', async () => {
      fixture.detectChanges();
      await (component as any).skipTurn();
      expect(mockMultiplayerService.selectPokemon).toHaveBeenCalledWith(null);
    });
  });

  // ==========================================================================
  // returnToLobby
  // ==========================================================================

  describe('returnToLobby', () => {
    it('calls leaveRoom and navigates to lobby', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      fixture.detectChanges();

      (component as any).returnToLobby();

      expect(mockMultiplayerService.leaveRoom).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/lobby']);
    });
  });

  // ==========================================================================
  // localPlayerWon computed
  // ==========================================================================

  describe('localPlayerWon', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('is false when winnerId is null', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ winnerId: null }));
      expect((component as any).localPlayerWon()).toBe(false);
    });

    it('is true when winnerId equals localPlayerId', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ winnerId: 1 }));
      expect((component as any).localPlayerWon()).toBe(true);
    });

    it('is false when winnerId does not equal localPlayerId', () => {
      store.setLocalPlayerId(1);
      store.setGameState(makeGameState({ winnerId: 2 }));
      expect((component as any).localPlayerWon()).toBe(false);
    });
  });

  // ==========================================================================
  // displayBattle linkedSignal
  // ==========================================================================

  describe('displayBattle', () => {
    it('tracks store lastBattle initially', () => {
      const battle = { attackerId: 'a', defenderId: 'b', attackerRoll: 5, defenderRoll: 3, attackerBonus: 0, defenderBonus: 0, winnerId: 'a', loserId: 'b' } as any;
      store.setGameState(makeGameState({ lastBattle: battle }));
      fixture.detectChanges();

      expect((component as any).displayBattle()).toEqual(battle);
    });

    it('can be dismissed locally without changing the store', () => {
      const battle = { attackerId: 'a', defenderId: 'b', attackerRoll: 5, defenderRoll: 3, attackerBonus: 0, defenderBonus: 0, winnerId: 'a', loserId: 'b' } as any;
      store.setGameState(makeGameState({ lastBattle: battle }));
      fixture.detectChanges();

      (component as any).displayBattle.set(null);

      expect((component as any).displayBattle()).toBeNull();
      expect(store.lastBattle()).toEqual(battle); // store still has it
    });
  });
});
