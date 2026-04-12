import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Spot, Passage, Pokemon, BattleResult } from '@pokemon-duel/board';
import { SpotComponent } from '../spot/spot.component';
import { PassageComponent } from '../passage/passage.component';
import { PokemonComponent } from '../pokemon/pokemon.component';
import { MatIconModule } from '@angular/material/icon';
import { BattleToastComponent } from './battle-toast/battle-toast.component';

const BOARD_DESIGN_WIDTH = 1000;
const BOARD_DESIGN_HEIGHT = 500;
const BENCH_MARGIN = 60;
const CANVAS_DESIGN_HEIGHT = BOARD_DESIGN_HEIGHT + BENCH_MARGIN * 2;
const BENCH_SIZE = 6;
const BENCH_SLOT_SPACING = 120;
const BENCH_START_X = 200;

type BenchSlot = {
  index: number;
  xPercent: number;
  yPercent: number;
  pokemon: Pokemon | null;
  playerId: number;
  spot: Spot;
};

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [SpotComponent, PassageComponent, PokemonComponent, MatIconModule, BattleToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent {
  public spots = input.required<Spot[]>();
  public passages = input.required<Passage[]>();
  public pokemonOnBoard = input.required<Pokemon[]>();
  public player1Bench = input.required<Pokemon[]>();
  public player2Bench = input.required<Pokemon[]>();
  public selectedPokemonId = input<string | null>(null);
  public validMoveTargets = input<string[]>([]);
  public currentPlayerId = input.required<number>();
  public phase = input.required<'setup' | 'playing' | 'ended'>();
  public lastBattle = input<BattleResult | null>(null);
  public isInteractive = input(true);

  public spotClicked = output<Spot>();
  public pokemonClicked = output<Pokemon>();
  public benchPokemonSelected = output<Pokemon>();
  public dismissBattle = output<void>();

  protected readonly toPercentX = (x: number): number => (x / BOARD_DESIGN_WIDTH) * 100;
  protected readonly boardToPercentY = (y: number): number =>
    ((y + BENCH_MARGIN) / CANVAS_DESIGN_HEIGHT) * 100;
  private readonly toBenchPercentY = (y: number): number => (y / CANVAS_DESIGN_HEIGHT) * 100;

  protected readonly spotMap = computed(() => {
    const map: Record<string, Spot> = {};
    for (const spot of this.spots()) {
      map[spot.id] = spot;
    }
    return map;
  });

  protected readonly passagesWithSpots = computed(() => {
    const spotMap = this.spotMap();
    return this.passages()
      .map((passage) => {
        const fromSpot = spotMap[passage.fromSpotId];
        const toSpot = spotMap[passage.toSpotId];
        if (!fromSpot || !toSpot) return null;
        return { passage, fromSpot, toSpot };
      })
      .filter(
        (p): p is { passage: Passage; fromSpot: Spot; toSpot: Spot } => p !== null,
      );
  });

  protected readonly allPokemon = computed(() => [
    ...this.pokemonOnBoard(),
    ...this.player1Bench(),
    ...this.player2Bench(),
  ]);

  protected readonly benchAreas = computed(() => {
    const allSpots = this.spots();
    const p1Entries = allSpots.filter(
      (s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 1,
    );
    const p2Entries = allSpots.filter(
      (s) => s.metadata.type === 'entry' && 'playerId' in s.metadata && s.metadata.playerId === 2,
    );

    const benchWidth = (BENCH_SIZE - 1) * BENCH_SLOT_SPACING + 60;
    const benchStartX = BENCH_START_X - 30;
    const x = (benchStartX / BOARD_DESIGN_WIDTH) * 100;
    const w = (benchWidth / BOARD_DESIGN_WIDTH) * 100;
    const h = (BENCH_MARGIN / CANVAS_DESIGN_HEIGHT) * 100;
    const p1BenchTopY = 100 - h;
    const p2BenchBottomY = h;

    return {
      p1: { x, y: 100 - h, w, h },
      p2: { x, y: 0, w, h },
      p1Connectors: p1Entries.map((entry) => ({
        x1: this.toPercentX(entry.x),
        y1: p1BenchTopY,
        x2: this.toPercentX(entry.x),
        y2: this.boardToPercentY(entry.y),
      })),
      p2Connectors: p2Entries.map((entry) => ({
        x1: this.toPercentX(entry.x),
        y1: p2BenchBottomY,
        x2: this.toPercentX(entry.x),
        y2: this.boardToPercentY(entry.y),
      })),
    };
  });

  protected readonly player1BenchSlots = computed(() =>
    this.buildBenchSlots(1, CANVAS_DESIGN_HEIGHT - BENCH_MARGIN / 2),
  );

  protected readonly player2BenchSlots = computed(() =>
    this.buildBenchSlots(2, BENCH_MARGIN / 2),
  );

  private buildBenchSlots(playerId: number, y: number): BenchSlot[] {
    const bench = playerId === 1 ? this.player1Bench() : this.player2Bench();
    const slots: BenchSlot[] = [];
    for (let i = 0; i < BENCH_SIZE; i++) {
      const x = BENCH_START_X + i * BENCH_SLOT_SPACING;
      slots.push({
        index: i,
        xPercent: this.toPercentX(x),
        yPercent: this.toBenchPercentY(y),
        pokemon: bench[i] ?? null,
        playerId,
        spot: {
          id: `bench-${playerId}-${i}`,
          name: '',
          x,
          y,
          metadata: { type: 'bench', playerId },
        },
      });
    }
    return slots;
  }

  protected getPokemonAtSpot(spotId: string): Pokemon | undefined {
    return this.pokemonOnBoard().find((p) => p.spotId === spotId);
  }

  protected isValidTarget(spotId: string): boolean {
    return this.validMoveTargets().includes(spotId);
  }

  protected isEnemyOccupied(spotId: string): boolean {
    const pokemon = this.getPokemonAtSpot(spotId);
    return pokemon !== undefined && pokemon.playerId !== this.currentPlayerId();
  }
}
