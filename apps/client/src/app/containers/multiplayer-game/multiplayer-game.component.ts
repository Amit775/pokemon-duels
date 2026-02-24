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
  MultiplayerService,
  MultiplayerStore,
  getSpecies,
  Pokemon,
  Spot,
} from '@pokemon-duel/board';

// Design viewport dimensions - all spot coordinates are relative to this
const BOARD_DESIGN_WIDTH = 1000;
const BOARD_DESIGN_HEIGHT = 500;
import { BenchComponent } from '../../components/bench/bench.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { SpotComponent } from '../../components/spot/spot.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-multiplayer-game',
  standalone: true,
  imports: [BenchComponent, PokemonComponent, PassageComponent, SpotComponent, MatButtonModule, MatIconModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiplayer-game.component.html',
  styleUrl: './multiplayer-game.component.scss',
})
export class MultiplayerGameComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly multiplayer = inject(MultiplayerService);

  // Store — single source of truth for all multiplayer state
  private readonly store = inject(MultiplayerStore);

  // Room info from store
  protected readonly roomCode = this.store.roomCode;
  protected readonly localPlayerId = this.store.localPlayerId;
  protected readonly isMyTurn = this.store.isMyTurn;

  // Game state from store
  protected readonly spots = this.store.spots;
  protected readonly passages = this.store.passages;
  protected readonly pokemon = this.store.pokemon;
  protected readonly currentPlayerId = this.store.currentPlayerId;
  protected readonly selectedPokemonId = this.store.selectedPokemonId;
  protected readonly validMoveTargets = this.store.validMoveTargets;
  protected readonly phase = this.store.phase;
  protected readonly winnerId = this.store.winnerId;
  protected readonly lastBattle = this.store.lastBattle;

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
    this.pokemon().filter((p) => p.spotId !== null),
  );

  // Player benches
  protected readonly player1Bench = computed(() =>
    this.pokemon().filter((p) => p.playerId === 1 && p.spotId === null),
  );
  protected readonly player2Bench = computed(() =>
    this.pokemon().filter((p) => p.playerId === 2 && p.spotId === null),
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
      const roomState = this.store.roomState();
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
    if (!this.isMyTurn()) return;

    const selectedId = this.selectedPokemonId();

    // If a Pokemon is selected and this is a valid target, move it
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      await this.multiplayer.movePokemon(selectedId, spot.id);
      return;
    }

    // If clicking a spot with a Pokemon, select it (if current player's)
    const pokemonAtSpot = this.getPokemonAtSpot(spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.localPlayerId()) {
      await this.multiplayer.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected async onPokemonClick(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;

    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  protected async onBenchPokemonSelect(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;

    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  protected async skipTurn(): Promise<void> {
    // Clear selection locally - server will advance turn
    await this.multiplayer.selectPokemon(null);
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
