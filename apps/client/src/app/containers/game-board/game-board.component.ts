import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { BoardService, GameStore, getSpecies, Pokemon, Spot } from '@pokemon-duel/board';
import { BenchComponent } from '../../components/bench/bench.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { SpotComponent } from '../../components/spot/spot.component';

// Design viewport dimensions - all spot coordinates are relative to this
const BOARD_DESIGN_WIDTH = 1000;
const BOARD_DESIGN_HEIGHT = 500;

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [BenchComponent, PokemonComponent, PassageComponent, SpotComponent],
  providers: [GameStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit {
  protected readonly gameStore = inject(GameStore);
  protected readonly boardService = inject(BoardService);

  // Computed signals for template
  protected readonly spots = computed(() => this.gameStore.spots());
  protected readonly passages = computed(() => this.gameStore.passages());
  protected readonly pokemonOnBoard = computed(() => this.gameStore.pokemonOnBoard());
  protected readonly currentPlayerId = computed(() => this.gameStore.currentPlayerId());
  protected readonly selectedPokemonId = computed(() => this.gameStore.selectedPokemonId());
  protected readonly validMoveTargets = computed(() => this.gameStore.validMoveTargets());
  protected readonly phase = computed(() => this.gameStore.phase());
  protected readonly winnerId = computed(() => this.gameStore.winnerId());
  protected readonly lastBattle = computed(() => this.gameStore.lastBattle());

  // Player benches
  protected readonly player1Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 1),
  );
  protected readonly player2Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 2),
  );

  // Get Pokemon at a spot for rendering
  protected getPokemonAtSpot(spotId: string): Pokemon | undefined {
    return this.pokemonOnBoard().find((p) => p.spotId === spotId);
  }

  // Get spot coordinates for Pokemon - use spotMap for O(1) lookup
  protected getSpotCoords(spotId: string): { x: number; y: number } | null {
    const spot = this.gameStore.spotMap()[spotId];
    return spot ? { x: spot.x, y: spot.y } : null;
  }

  // Convert pixel coordinates to percentage for responsive layout
  protected toPercentX(x: number): number {
    return (x / BOARD_DESIGN_WIDTH) * 100;
  }

  protected toPercentY(y: number): number {
    return (y / BOARD_DESIGN_HEIGHT) * 100;
  }

  // Get Pokemon by ID - use pokemonEntityMap for O(1) lookup
  protected getPokemonById(id: string): Pokemon | undefined {
    return this.gameStore.pokemonEntityMap()[id];
  }

  // Get species name
  protected getSpeciesName(speciesId: string): string {
    return getSpecies(speciesId)?.name ?? 'Unknown';
  }

  ngOnInit(): void {
    this.loadBoardAndStart();
  }

  private loadBoardAndStart(): void {
    // Try to load board from localStorage
    const board = this.boardService.loadBoard();
    if (board) {
      this.gameStore.initializeGame(board.spots, board.passages, 2);
      this.gameStore.setupInitialPokemon();
    }
  }

  protected onSpotClick(spot: Spot): void {
    const selectedId = this.selectedPokemonId();

    // If a Pokemon is selected and this is a valid target, move it
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      const result = this.gameStore.movePokemon(selectedId, spot.id);

      // Only end turn if game hasn't ended
      if (result.success && !result.won) {
        this.gameStore.endTurn();
      }
      return;
    }

    // If clicking a spot with a Pokemon, select it (if current player's)
    const pokemonAtSpot = this.getPokemonAtSpot(spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected onPokemonClick(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected onBenchPokemonSelect(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected skipTurn(): void {
    this.gameStore.clearSelection();
    this.gameStore.clearBattle();
    this.gameStore.endTurn();
  }

  protected resetGame(): void {
    this.gameStore.resetGame();
    this.gameStore.setupInitialPokemon();
  }

  protected isValidTarget(spotId: string): boolean {
    return this.validMoveTargets().includes(spotId);
  }

  protected isEnemyOccupied(spotId: string): boolean {
    const pokemon = this.getPokemonAtSpot(spotId);
    return pokemon !== undefined && pokemon.playerId !== this.currentPlayerId();
  }
}
