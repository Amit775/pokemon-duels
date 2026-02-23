import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  getSpecies,
  Pokemon,
  Spot,
  GameStore,
} from '@pokemon-duel/board';

// Design viewport dimensions - all spot coordinates are relative to this
const BOARD_DESIGN_WIDTH = 1000;
const BOARD_DESIGN_HEIGHT = 500;
import { BenchComponent } from '../../components/bench/bench.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { SpotComponent } from '../../components/spot/spot.component';

@Component({
  selector: 'app-multiplayer-game',
  standalone: true,
  imports: [BenchComponent, PokemonComponent, PassageComponent, SpotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiplayer-game.component.html',
  styleUrl: './multiplayer-game.component.scss',
})
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly gameStore = inject(GameStore);

  // Room info (if needed, can be injected from a separate multiplayer state service)
  // protected readonly roomCode = ...
  // protected readonly localPlayerId = ...
  // protected readonly isMyTurn = ...

  // Game state from signal store
  protected readonly spots = this.gameStore.spots;
  protected readonly passages = this.gameStore.passages;
  protected readonly pokemon = this.gameStore.pokemonOnBoard;
  protected readonly currentPlayerId = this.gameStore.currentPlayerId;
  protected readonly selectedPokemonId = this.gameStore.selectedPokemonId;
  protected readonly validMoveTargets = this.gameStore.validMoveTargets;
  protected readonly phase = this.gameStore.phase;
  protected readonly winnerId = this.gameStore.winnerId;
  protected readonly lastBattle = this.gameStore.lastBattle;

  // Spot map for O(1) lookups
  protected readonly spotMap = computed(() => {
    const map: Record<string, Spot> = {};
    for (const spot of this.spots()) {
      map[spot.id] = spot;
    }
    return map;
  });

  // Pokemon on board (not on bench)
  protected readonly pokemonOnBoard = computed(() =>
    this.pokemon().filter((p) => p.spotId !== null)
  );

  // Player benches
  protected readonly player1Bench = computed(() =>
    this.pokemon().filter((p) => p.playerId === 1 && p.spotId === null)
  );
  protected readonly player2Bench = computed(() =>
    this.pokemon().filter((p) => p.playerId === 2 && p.spotId === null)
  );

  // Check if local player won/lost
  protected readonly localPlayerWon = computed(() => {
    const winner = this.winnerId();
    const local = this.localPlayerId();
    return winner !== null && winner === local;
  });

  constructor() {
    // Effect to navigate back to lobby if not in a room
    effect(() => {
      const roomState = this.multiplayer.roomState();
      if (roomState === 'idle') {
        this.router.navigate(['/lobby']);
      }
    });
  }

  ngOnInit(): void {
    // Check if we're in a room, if not try to join
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (roomId && !this.roomCode()) {
      // Try to join the room
      this.multiplayer.joinRoom(roomId);
    }
  }

  ngOnDestroy(): void {
    // Optionally leave room on destroy
  }

  // Get Pokemon at a spot for rendering
  protected getPokemonAtSpot(spotId: string): Pokemon | undefined {
    return this.pokemonOnBoard().find((p) => p.spotId === spotId);
  }

  // Get spot coordinates for Pokemon
  protected getSpotCoords(spotId: string): { x: number; y: number } | null {
    const spot = this.spotMap()[spotId];
    return spot ? { x: spot.x, y: spot.y } : null;
  }

  // Convert pixel coordinates to percentage for responsive layout
  protected toPercentX(x: number): number {
    return (x / BOARD_DESIGN_WIDTH) * 100;
  }

  protected toPercentY(y: number): number {
    return (y / BOARD_DESIGN_HEIGHT) * 100;
  }

  // Get Pokemon by ID
  protected getPokemonById(id: string): Pokemon | undefined {
    return this.pokemon().find((p) => p.id === id);
  }

  // Get species name
  protected getSpeciesName(speciesId: string): string {
    return getSpecies(speciesId)?.name ?? 'Unknown';
  }

  protected async onSpotClick(spot: Spot): Promise<void> {
    // All actions should dispatch to the store (which will sync with server via MultiplayerService)
    const selectedId = this.selectedPokemonId();
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      await this.gameStore.movePokemon(selectedId, spot.id);
      return;
    }
    const pokemonAtSpot = this.getPokemonAtSpot(spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.currentPlayerId()) {
      await this.gameStore.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected async onPokemonClick(pokemon: Pokemon): Promise<void> {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      await this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected async onBenchPokemonSelect(pokemon: Pokemon): Promise<void> {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      await this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected async skipTurn(): Promise<void> {
    await this.gameStore.clearSelection();
    await this.gameStore.clearBattle();
    await this.gameStore.endTurn();
  }

  protected leaveGame(): void {
    this.multiplayer.leaveRoom();
    this.router.navigate(['/lobby']);
  }

  protected backToLobby(): void {
    this.multiplayer.leaveRoom();
    this.router.navigate(['/lobby']);
  }

  protected isValidTarget(spotId: string): boolean {
    return this.validMoveTargets().includes(spotId);
  }

  protected isEnemyOccupied(spotId: string): boolean {
    const pokemon = this.getPokemonAtSpot(spotId);
    return pokemon !== undefined && pokemon.playerId !== this.localPlayerId();
  }
}
