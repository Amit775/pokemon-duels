import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { BoardService, GameStore, getSpecies, Pokemon, Spot } from '@pokemon-duel/board';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { SpotComponent } from '../../components/spot/spot.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

const BOARD_DESIGN_WIDTH = 1000;
const BOARD_DESIGN_HEIGHT = 500;
const BENCH_MARGIN = 60;
const CANVAS_DESIGN_HEIGHT = BOARD_DESIGN_HEIGHT + BENCH_MARGIN * 2;

const BENCH_SIZE = 6;
const BENCH_SLOT_SPACING = 80;
const BENCH_START_X = (BOARD_DESIGN_WIDTH - (BENCH_SIZE - 1) * BENCH_SLOT_SPACING) / 2;

export type BenchSlot = {
  index: number;
  xPercent: number;
  yPercent: number;
  pokemon: Pokemon | null;
  playerId: number;
};

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [PokemonComponent, PassageComponent, SpotComponent, MatButtonModule, MatIconModule, MatChipsModule],
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

  // Bench area dimensions (percentages for SVG rendering)
  protected readonly benchAreas = computed(() => {
    const benchWidth = (BENCH_SIZE - 1) * BENCH_SLOT_SPACING + 60; // slots + padding
    const benchStartX = BENCH_START_X - 30; // left padding
    const x = (benchStartX / BOARD_DESIGN_WIDTH) * 100;
    const w = (benchWidth / BOARD_DESIGN_WIDTH) * 100;
    const h = (BENCH_MARGIN / CANVAS_DESIGN_HEIGHT) * 100;

    // P1 entry points at y=450 → percentY = (450+60)/620
    const p1EntryY = this.boardToPercentY(450);
    const p2EntryY = this.boardToPercentY(50);
    // Entry X positions: 200 and 800
    const entryLeftX = this.toPercentX(200);
    const entryRightX = this.toPercentX(800);

    return {
      // P1 bench area (bottom)
      p1: { x, y: 100 - h, w, h },
      // P2 bench area (top)
      p2: { x, y: 0, w, h },
      // Connector lines from bench edges to entry points
      p1Connectors: [
        { x1: entryLeftX, y1: 100 - h, x2: entryLeftX, y2: p1EntryY },
        { x1: entryRightX, y1: 100 - h, x2: entryRightX, y2: p1EntryY },
      ],
      p2Connectors: [
        { x1: entryLeftX, y1: h, x2: entryLeftX, y2: p2EntryY },
        { x1: entryRightX, y1: h, x2: entryRightX, y2: p2EntryY },
      ],
    };
  });

  // Bench slots positioned inside the canvas
  protected readonly player1BenchSlots = computed(() =>
    this.buildBenchSlots(1, CANVAS_DESIGN_HEIGHT - BENCH_MARGIN / 2),
  );
  protected readonly player2BenchSlots = computed(() =>
    this.buildBenchSlots(2, BENCH_MARGIN / 2),
  );

  // Battle toast auto-dismiss
  protected readonly showBattle = signal(false);
  private battleDismissTimer: ReturnType<typeof setTimeout> | null = null;

  private battleEffect = effect(() => {
    const battle = this.gameStore.lastBattle();
    if (battle) {
      this.showBattle.set(true);
      if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = setTimeout(() => this.dismissBattle(), 5000);
    } else {
      this.showBattle.set(false);
    }
  });

  protected dismissBattle(): void {
    if (this.battleDismissTimer) {
      clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = null;
    }
    this.showBattle.set(false);
    this.gameStore.clearBattle();
  }

  private buildBenchSlots(playerId: number, y: number): BenchSlot[] {
    const pokemon = this.gameStore.benchPokemon().filter((p) => p.playerId === playerId);
    const slots: BenchSlot[] = [];
    for (let i = 0; i < BENCH_SIZE; i++) {
      slots.push({
        index: i,
        xPercent: this.toPercentX(BENCH_START_X + i * BENCH_SLOT_SPACING),
        yPercent: (y / CANVAS_DESIGN_HEIGHT) * 100,
        pokemon: pokemon[i] ?? null,
        playerId,
      });
    }
    return slots;
  }

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

  // Board spot Y: offset by bench margin, then percentage of canvas height
  protected boardToPercentY(y: number): number {
    return ((y + BENCH_MARGIN) / CANVAS_DESIGN_HEIGHT) * 100;
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
