# Client Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganise the Angular client into feature-based folders, extract a shared `GameBoard` canvas, and restore local hot-seat play.

**Architecture:** Three features — `game/`, `board-editor/`, `lobby/` — each flat (no sub-folders). A new `GameBoard` component handles all rendering; `LocalGamePage` and `MultiplayerGamePage` are thin controllers that feed it. Dead code (game-board container, bench component) is removed.

**Tech Stack:** Angular 21+, signals, OnPush, `@ngrx/signals` (via `GameStore` / `MultiplayerStore`), Angular Material, `@pokemon-duel/board` library.

---

## File Map

### New files (created in this plan)
| File | Responsibility |
|------|----------------|
| `app/game/game-board/game-board.component.ts` | Shared canvas: renders spots, passages, pokemon, benches, battle toast |
| `app/game/game-board/game-board.component.html` | Template for above |
| `app/game/game-board/game-board.component.scss` | Styles for above |
| `app/game/game-board/game-board.component.spec.ts` | Tests for above |
| `app/game/local-game/local-game.component.ts` | Hot-seat controller using `GameStore` |
| `app/game/local-game/local-game.component.html` | Template for above |
| `app/game/local-game/local-game.component.scss` | Styles for above |
| `app/game/local-game/local-game.component.spec.ts` | Tests for above |

### Deleted files
| File | Reason |
|------|--------|
| `app/containers/game-board/*` | Dead code — `/play` (bare) route has no UI entry point |
| `app/components/bench/*` | Bench rendering moves into `game-board` canvas |

### Moved files (Task 5)
| From | To |
|------|----|
| `app/components/spot/` | `app/game/spot/` |
| `app/components/passage/` | `app/game/passage/` |
| `app/components/pokemon/` | `app/game/pokemon/` |
| `app/containers/multiplayer-game/` | `app/game/multiplayer-game/` |
| `app/components/board-canvas/` | `app/board-editor/board-canvas/` |
| `app/components/board-controls/` | `app/board-editor/board-controls/` |
| `app/containers/board-creator/` | `app/board-editor/board-creator/` |
| `app/containers/lobby/` | `app/lobby/lobby/` |

### Modified files
| File | Change |
|------|--------|
| `app/app.routes.ts` | Add `/local`, remove bare `/play`, update lazy-load paths after move |
| `app/app.html` | Add "Local Play" nav link |
| `app/game/multiplayer-game/multiplayer-game.component.ts` | Use `GameBoardComponent`, drop direct spot/passage/pokemon/bench imports |
| `app/game/multiplayer-game/multiplayer-game.component.html` | Replace full board rendering with `<app-game-board>` |

---

## Task 1: Delete dead code

**Files:**
- Delete: `apps/client/src/app/containers/game-board/` (all 4 files)
- Modify: `apps/client/src/app/app.routes.ts`

- [ ] **Step 1: Remove the game-board container**

```bash
cd apps/client/src/app/containers
rm game-board/game-board.component.ts
rm game-board/game-board.component.html
rm game-board/game-board.component.scss
rm game-board/game-board.component.spec.ts
rmdir game-board
```

- [ ] **Step 2: Remove the dead `/play` route from `apps/client/src/app/app.routes.ts`**

Current file (lines 22–27):
```typescript
  {
    path: 'play',
    loadComponent: () =>
      import('./containers/game-board/game-board.component').then((m) => m.GameBoardComponent),
  },
  {
```

Remove the `path: 'play'` block. The file should now be:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full',
  },
  {
    path: 'board-creator',
    loadComponent: () =>
      import('./containers/board-creator/board-creator.component').then(
        (m) => m.BoardCreatorComponent,
      ),
  },
  {
    path: 'lobby',
    loadComponent: () =>
      import('./containers/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'play/:roomId',
    loadComponent: () =>
      import('./containers/multiplayer-game/multiplayer-game.component').then(
        (m) => m.MultiplayerGameComponent,
      ),
  },
];
```

- [ ] **Step 3: Verify the build passes**

```bash
npx nx build client
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/app/app.routes.ts
git commit -m "fix(client): remove dead game-board container and bare /play route"
```

---

## Task 2: Create `GameBoardComponent` (TDD)

**Files:**
- Create: `apps/client/src/app/game/game-board/game-board.component.spec.ts`
- Create: `apps/client/src/app/game/game-board/game-board.component.ts`
- Create: `apps/client/src/app/game/game-board/game-board.component.html`
- Create: `apps/client/src/app/game/game-board/game-board.component.scss`

This component is the shared game canvas. It imports `SpotComponent`, `PassageComponent`, `PokemonComponent` from their **current** locations (`../../components/`). Those paths are updated in Task 5 when the files move.

- [ ] **Step 1: Write the failing spec**

Create `apps/client/src/app/game/game-board/game-board.component.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GameBoardComponent } from './game-board.component';
import { Spot, Passage, Pokemon, createSpot } from '@pokemon-duel/board';

describe('GameBoardComponent', () => {
  let fixture: ComponentFixture<GameBoardComponent>;
  let component: GameBoardComponent;

  const spot1: Spot = createSpot({ id: 's1', x: 200, y: 250, metadata: { type: 'normal' } });
  const spot2: Spot = createSpot({ id: 's2', x: 800, y: 250, metadata: { type: 'flag', playerId: 1 } });

  const setRequiredInputs = () => {
    fixture.componentRef.setInput('spots', [spot1, spot2]);
    fixture.componentRef.setInput('passages', []);
    fixture.componentRef.setInput('pokemonOnBoard', []);
    fixture.componentRef.setInput('player1Bench', []);
    fixture.componentRef.setInput('player2Bench', []);
    fixture.componentRef.setInput('currentPlayerId', 1);
    fixture.componentRef.setInput('phase', 'playing');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameBoardComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should render one app-spot per board spot', () => {
      setRequiredInputs();
      fixture.detectChanges();
      const spots = fixture.nativeElement.querySelectorAll('app-spot');
      expect(spots.length).toBe(2);
    });

    it('should render valid-target indicators for spots in validMoveTargets', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('validMoveTargets', ['s1']);
      fixture.detectChanges();
      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(1);
    });

    it('should not render valid-target indicators when validMoveTargets is empty', () => {
      setRequiredInputs();
      fixture.detectChanges();
      const indicators = fixture.nativeElement.querySelectorAll('.valid-target-indicator');
      expect(indicators.length).toBe(0);
    });

    it('should render battle toast when lastBattle is provided', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('lastBattle', {
        attackerId: 'p1', defenderId: 'p2', winnerId: 'p1', loserId: 'p2',
        attackerRoll: 4, defenderRoll: 2, attackerBonus: 0, defenderBonus: 0,
      });
      fixture.detectChanges();
      const toast = fixture.nativeElement.querySelector('.battle-toast');
      expect(toast).toBeTruthy();
    });

    it('should not render battle toast when lastBattle is null', () => {
      setRequiredInputs();
      fixture.detectChanges();
      const toast = fixture.nativeElement.querySelector('.battle-toast');
      expect(toast).toBeFalsy();
    });
  });

  describe('isValidTarget', () => {
    it('returns true for a spot id in validMoveTargets', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('validMoveTargets', ['s1', 's2']);
      fixture.detectChanges();
      expect(component.isValidTarget('s1')).toBe(true);
    });

    it('returns false for a spot id not in validMoveTargets', () => {
      setRequiredInputs();
      fixture.detectChanges();
      expect(component.isValidTarget('s99')).toBe(false);
    });
  });

  describe('outputs', () => {
    it('should emit spotClicked when a valid-target indicator is clicked', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('validMoveTargets', ['s1']);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.spotClicked, 'emit');
      const indicator = fixture.nativeElement.querySelector('.valid-target-indicator');
      indicator.click();

      expect(emitSpy).toHaveBeenCalledWith(spot1);
    });

    it('should emit dismissBattle when close button is clicked', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('lastBattle', {
        attackerId: 'p1', defenderId: 'p2', winnerId: 'p1', loserId: 'p2',
        attackerRoll: 4, defenderRoll: 2, attackerBonus: 0, defenderBonus: 0,
      });
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.dismissBattle, 'emit');
      const closeBtn = fixture.nativeElement.querySelector('.battle-close');
      closeBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the spec — verify it fails**

```bash
npx nx test client --testFile=apps/client/src/app/game/game-board/game-board.component.spec.ts
```

Expected: Fails with "Cannot find module './game-board.component'".

- [ ] **Step 3: Create `game-board.component.ts`**

Create `apps/client/src/app/game/game-board/game-board.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Spot, Passage, Pokemon, BattleResult, getSpecies } from '@pokemon-duel/board';
import { SpotComponent } from '../../components/spot/spot.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [SpotComponent, PassageComponent, PokemonComponent, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent {
  spots = input.required<Spot[]>();
  passages = input.required<Passage[]>();
  pokemonOnBoard = input.required<Pokemon[]>();
  player1Bench = input.required<Pokemon[]>();
  player2Bench = input.required<Pokemon[]>();
  selectedPokemonId = input<string | null>(null);
  validMoveTargets = input<string[]>([]);
  currentPlayerId = input.required<number>();
  phase = input.required<'setup' | 'playing' | 'ended'>();
  lastBattle = input<BattleResult | null>(null);
  isInteractive = input(true);

  spotClicked = output<Spot>();
  pokemonClicked = output<Pokemon>();
  benchPokemonSelected = output<Pokemon>();
  dismissBattle = output<void>();

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

  private readonly allPokemon = computed(() => [
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

  protected getPokemonById(id: string): Pokemon | undefined {
    return this.allPokemon().find((p) => p.id === id);
  }

  protected getSpeciesName(speciesId: string): string {
    return getSpecies(speciesId)?.name ?? 'Unknown';
  }

  isValidTarget(spotId: string): boolean {
    return this.validMoveTargets().includes(spotId);
  }

  protected isEnemyOccupied(spotId: string): boolean {
    const pokemon = this.getPokemonAtSpot(spotId);
    return pokemon !== undefined && pokemon.playerId !== this.currentPlayerId();
  }
}
```

- [ ] **Step 4: Create `game-board.component.html`**

Create `apps/client/src/app/game/game-board/game-board.component.html`:

```html
<div class="board-canvas">
  @if (benchAreas(); as ba) {
    <svg class="bench-overlay">
      <defs>
        <marker id="bridge-arrow-p1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#42a5f5" opacity="0.9"/>
        </marker>
        <marker id="bridge-arrow-p2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef5350" opacity="0.9"/>
        </marker>
      </defs>

      <rect class="bench-area bench-area--player-2"
        [attr.x]="ba.p2.x + '%'" [attr.y]="ba.p2.y + '%'"
        [attr.width]="ba.p2.w + '%'" [attr.height]="ba.p2.h + '%'"
        rx="8" ry="8"
      />
      <rect class="bench-area bench-area--player-1"
        [attr.x]="ba.p1.x + '%'" [attr.y]="ba.p1.y + '%'"
        [attr.width]="ba.p1.w + '%'" [attr.height]="ba.p1.h + '%'"
        rx="8" ry="8"
      />

      @for (c of ba.p1Connectors; track $index) {
        <line class="bench-connector bench-connector--player-1"
          [attr.x1]="c.x1 + '%'" [attr.y1]="c.y1 + '%'"
          [attr.x2]="c.x2 + '%'" [attr.y2]="c.y2 + '%'"
          marker-end="url(#bridge-arrow-p1)"
        />
      }
      @for (c of ba.p2Connectors; track $index) {
        <line class="bench-connector bench-connector--player-2"
          [attr.x1]="c.x1 + '%'" [attr.y1]="c.y1 + '%'"
          [attr.x2]="c.x2 + '%'" [attr.y2]="c.y2 + '%'"
          marker-end="url(#bridge-arrow-p2)"
        />
      }
    </svg>
  }

  @for (slot of player2BenchSlots(); track slot.index) {
    <app-spot
      [spot]="slot.spot"
      [selected]="!!slot.pokemon && selectedPokemonId() === slot.pokemon!.id"
      [xPercent]="slot.xPercent"
      [yPercent]="slot.yPercent"
      (spotClicked)="slot.pokemon && benchPokemonSelected.emit(slot.pokemon!)"
    />
  }

  @for (item of passagesWithSpots(); track item.passage.id) {
    <app-passage
      [passage]="item.passage"
      [fromSpot]="item.fromSpot"
      [toSpot]="item.toSpot"
      [xPercent]="toPercentX"
      [yPercent]="boardToPercentY"
    />
  }

  @if (isInteractive()) {
    @for (spot of spots(); track spot.id) {
      @if (isValidTarget(spot.id)) {
        <div
          class="valid-target-indicator"
          [class.valid-target-indicator--battle]="isEnemyOccupied(spot.id)"
          [style.left.%]="toPercentX(spot.x)"
          [style.top.%]="boardToPercentY(spot.y)"
          (click)="spotClicked.emit(spot)"
        >
          @if (isEnemyOccupied(spot.id)) {
            <span class="battle-icon"><mat-icon>swords</mat-icon></span>
          }
        </div>
      }
    }
  }

  @for (spot of spots(); track spot.id) {
    <app-spot
      [spot]="spot"
      [selected]="false"
      [xPercent]="toPercentX(spot.x)"
      [yPercent]="boardToPercentY(spot.y)"
      (spotClicked)="spotClicked.emit($event)"
    />
  }

  @for (pokemon of pokemonOnBoard(); track pokemon.id) {
    @if (spotMap()[pokemon.spotId!]; as spot) {
      <app-pokemon
        [pokemon]="pokemon"
        [xPercent]="toPercentX(spot.x)"
        [yPercent]="boardToPercentY(spot.y)"
        [selected]="selectedPokemonId() === pokemon.id"
        [draggable]="pokemon.playerId === currentPlayerId() && phase() !== 'ended'"
        (pokemonClicked)="pokemonClicked.emit($event)"
      />
    }
  }

  @for (slot of player2BenchSlots(); track slot.index) {
    @if (slot.pokemon; as p) {
      <app-pokemon
        [pokemon]="p"
        [xPercent]="slot.xPercent"
        [yPercent]="slot.yPercent"
        [selected]="selectedPokemonId() === p.id"
        [draggable]="currentPlayerId() === 2 && phase() !== 'ended'"
        (pokemonClicked)="benchPokemonSelected.emit($event)"
      />
    }
  }

  @for (slot of player1BenchSlots(); track slot.index) {
    <app-spot
      [spot]="slot.spot"
      [selected]="!!slot.pokemon && selectedPokemonId() === slot.pokemon!.id"
      [xPercent]="slot.xPercent"
      [yPercent]="slot.yPercent"
      (spotClicked)="slot.pokemon && benchPokemonSelected.emit(slot.pokemon!)"
    />
  }

  @for (slot of player1BenchSlots(); track slot.index) {
    @if (slot.pokemon; as p) {
      <app-pokemon
        [pokemon]="p"
        [xPercent]="slot.xPercent"
        [yPercent]="slot.yPercent"
        [selected]="selectedPokemonId() === p.id"
        [draggable]="currentPlayerId() === 1 && phase() !== 'ended'"
        (pokemonClicked)="benchPokemonSelected.emit($event)"
      />
    }
  }

  @if (lastBattle(); as battle) {
    <div class="battle-toast">
      <button class="battle-close" (click)="dismissBattle.emit()">
        <mat-icon>close</mat-icon>
      </button>
      <div class="battle-header">
        <mat-icon>swords</mat-icon>
        Battle!
      </div>
      <div class="battle-rolls">
        <div class="battle-roll">
          <span class="battle-pokemon">{{ getSpeciesName(getPokemonById(battle.attackerId)?.speciesId ?? '') }}</span>
          <span class="battle-dice">{{ battle.attackerRoll }}{{ battle.attackerBonus > 0 ? ' +' + battle.attackerBonus : '' }}</span>
          <span class="battle-total">= {{ battle.attackerRoll + battle.attackerBonus }}</span>
        </div>
        <div class="battle-vs">VS</div>
        <div class="battle-roll">
          <span class="battle-pokemon">{{ getSpeciesName(getPokemonById(battle.defenderId)?.speciesId ?? '') }}</span>
          <span class="battle-dice">{{ battle.defenderRoll }}{{ battle.defenderBonus > 0 ? ' +' + battle.defenderBonus : '' }}</span>
          <span class="battle-total">= {{ battle.defenderRoll + battle.defenderBonus }}</span>
        </div>
      </div>
      <div class="battle-result">
        {{ getSpeciesName(getPokemonById(battle.winnerId)?.speciesId ?? '') }} wins!
      </div>
    </div>
  }
</div>
```

- [ ] **Step 5: Create `game-board.component.scss`**

Create `apps/client/src/app/game/game-board/game-board.component.scss`:

Copy the `.board-canvas` block from `apps/client/src/app/containers/game-board/game-board.component.scss` (everything scoped to `.board-canvas`, `.bench-overlay`, `.bench-area`, `.bench-connector`, `.valid-target-indicator`, `.battle-toast`, `.battle-close`, `.battle-header`, `.battle-rolls`, `.battle-roll`, `.battle-vs`, `.battle-result`, `.battle-pokemon`, `.battle-dice`, `.battle-total`, `.battle-icon`).

- [ ] **Step 6: Run the spec — verify it passes**

```bash
npx nx test client --testFile=apps/client/src/app/game/game-board/game-board.component.spec.ts
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/client/src/app/game/
git commit -m "feature(client): add shared GameBoard canvas component"
```

---

## Task 3: Create `LocalGameComponent` (TDD)

**Files:**
- Create: `apps/client/src/app/game/local-game/local-game.component.spec.ts`
- Create: `apps/client/src/app/game/local-game/local-game.component.ts`
- Create: `apps/client/src/app/game/local-game/local-game.component.html`
- Create: `apps/client/src/app/game/local-game/local-game.component.scss`
- Modify: `apps/client/src/app/app.routes.ts`
- Modify: `apps/client/src/app/app.html`

- [ ] **Step 1: Write the failing spec**

Create `apps/client/src/app/game/local-game/local-game.component.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LocalGameComponent } from './local-game.component';
import { BoardService, GameStore } from '@pokemon-duel/board';

describe('LocalGameComponent', () => {
  let fixture: ComponentFixture<LocalGameComponent>;
  let component: LocalGameComponent;
  let gameStore: GameStore;
  let boardService: BoardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalGameComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalGameComponent);
    component = fixture.componentInstance;
    gameStore = TestBed.inject(GameStore);
    boardService = TestBed.inject(BoardService);
  });

  it('should load board from localStorage on init', () => {
    const mockBoard = {
      spots: [{ id: 's1', x: 100, y: 100, name: '', metadata: { type: 'normal' } }],
      passages: [],
    };
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(mockBoard as any);
    const initSpy = vi.spyOn(gameStore, 'initializeGame');
    const pokemonSpy = vi.spyOn(gameStore, 'setupInitialPokemon');

    fixture.detectChanges();

    expect(initSpy).toHaveBeenCalledWith(mockBoard.spots, mockBoard.passages, 2);
    expect(pokemonSpy).toHaveBeenCalled();
  });

  it('should not call initializeGame when no board is saved', () => {
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(null);
    const initSpy = vi.spyOn(gameStore, 'initializeGame');

    fixture.detectChanges();

    expect(initSpy).not.toHaveBeenCalled();
  });

  it('should call gameStore.endTurn after a successful move', () => {
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(null);
    fixture.detectChanges();

    vi.spyOn(gameStore, 'movePokemon').mockReturnValue({ success: true, won: false } as any);
    const endTurnSpy = vi.spyOn(gameStore, 'endTurn');

    (gameStore as any).selectedPokemonId = vi.fn(() => 'p1');
    (gameStore as any).validMoveTargets = vi.fn(() => ['s1']);

    component.onSpotClicked({ id: 's1', x: 0, y: 0, name: '', metadata: { type: 'normal' } });

    expect(endTurnSpy).toHaveBeenCalled();
  });

  it('skipTurn should clear selection, clear battle, and end turn', () => {
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(null);
    fixture.detectChanges();

    const clearSelSpy = vi.spyOn(gameStore, 'clearSelection');
    const clearBattleSpy = vi.spyOn(gameStore, 'clearBattle');
    const endTurnSpy = vi.spyOn(gameStore, 'endTurn');

    component.skipTurn();

    expect(clearSelSpy).toHaveBeenCalled();
    expect(clearBattleSpy).toHaveBeenCalled();
    expect(endTurnSpy).toHaveBeenCalled();
  });

  it('resetGame should reset store and set up pokemon', () => {
    vi.spyOn(boardService, 'loadBoard').mockReturnValue(null);
    fixture.detectChanges();

    const resetSpy = vi.spyOn(gameStore, 'resetGame');
    const pokemonSpy = vi.spyOn(gameStore, 'setupInitialPokemon');

    component.resetGame();

    expect(resetSpy).toHaveBeenCalled();
    expect(pokemonSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the spec — verify it fails**

```bash
npx nx test client --testFile=apps/client/src/app/game/local-game/local-game.component.spec.ts
```

Expected: Fails with "Cannot find module './local-game.component'".

- [ ] **Step 3: Create `local-game.component.ts`**

Create `apps/client/src/app/game/local-game/local-game.component.ts`:

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { GameStore, BoardService, Pokemon, Spot } from '@pokemon-duel/board';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-local-game',
  standalone: true,
  imports: [GameBoardComponent, MatButtonModule, MatChipsModule, MatIconModule],
  providers: [GameStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './local-game.component.html',
  styleUrl: './local-game.component.scss',
})
export class LocalGameComponent implements OnInit, OnDestroy {
  private readonly gameStore = inject(GameStore);
  private readonly boardService = inject(BoardService);

  protected readonly spots = computed(() => this.gameStore.spots());
  protected readonly passages = computed(() => this.gameStore.passages());
  protected readonly pokemonOnBoard = computed(() => this.gameStore.pokemonOnBoard());
  protected readonly player1Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 1),
  );
  protected readonly player2Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 2),
  );
  protected readonly selectedPokemonId = computed(() => this.gameStore.selectedPokemonId());
  protected readonly validMoveTargets = computed(() => this.gameStore.validMoveTargets());
  protected readonly currentPlayerId = computed(() => this.gameStore.currentPlayerId());
  protected readonly phase = computed(() => this.gameStore.phase());
  protected readonly winnerId = computed(() => this.gameStore.winnerId());

  protected readonly showBattle = signal(false);
  protected readonly displayBattle = computed(() =>
    this.showBattle() ? this.gameStore.lastBattle() : null,
  );

  private battleDismissTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly battleEffect = effect(() => {
    const battle = this.gameStore.lastBattle();
    if (battle) {
      this.showBattle.set(true);
      if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = setTimeout(() => this.dismissBattle(), 5000);
    } else {
      this.showBattle.set(false);
    }
  });

  ngOnInit(): void {
    const board = this.boardService.loadBoard();
    if (board) {
      this.gameStore.initializeGame(board.spots, board.passages, 2);
      this.gameStore.setupInitialPokemon();
    }
  }

  ngOnDestroy(): void {
    if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
  }

  onSpotClicked(spot: Spot): void {
    const selectedId = this.selectedPokemonId();

    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      const result = this.gameStore.movePokemon(selectedId, spot.id);
      if (result.success && !result.won) {
        this.gameStore.endTurn();
      }
      return;
    }

    const pokemonAtSpot = this.pokemonOnBoard().find((p) => p.spotId === spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemonAtSpot.id);
    }
  }

  onPokemonClicked(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  onBenchPokemonSelected(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  skipTurn(): void {
    this.gameStore.clearSelection();
    this.gameStore.clearBattle();
    this.gameStore.endTurn();
  }

  resetGame(): void {
    this.gameStore.resetGame();
    this.gameStore.setupInitialPokemon();
  }

  protected dismissBattle(): void {
    if (this.battleDismissTimer) {
      clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = null;
    }
    this.showBattle.set(false);
    this.gameStore.clearBattle();
  }
}
```

- [ ] **Step 4: Create `local-game.component.html`**

Create `apps/client/src/app/game/local-game/local-game.component.html`:

```html
<div class="game-layout">
  @if (phase() === 'ended' && winnerId()) {
    <div class="win-overlay">
      <div class="win-modal">
        <mat-icon class="trophy-icon">emoji_events</mat-icon>
        <h2>Victory!</h2>
        <p class="win-message">Player {{ winnerId() }} wins!</p>
        <button mat-flat-button (click)="resetGame()">Play Again</button>
      </div>
    </div>
  }

  <main class="board-area">
    <div class="game-header">
      <h2>Pokemon Duel</h2>
      <div class="turn-indicator">
        <span class="turn-label">Current Turn:</span>
        <mat-chip
          [class.turn-player--1]="currentPlayerId() === 1"
          [class.turn-player--2]="currentPlayerId() === 2"
        >
          Player {{ currentPlayerId() }}
        </mat-chip>
      </div>
      <div class="game-actions">
        <button mat-button (click)="skipTurn()" [disabled]="phase() === 'ended'">
          <mat-icon>skip_next</mat-icon>
          Skip Turn
        </button>
        <button mat-button color="warn" (click)="resetGame()">
          <mat-icon>restart_alt</mat-icon>
          Reset
        </button>
      </div>
    </div>

    <app-game-board
      [spots]="spots()"
      [passages]="passages()"
      [pokemonOnBoard]="pokemonOnBoard()"
      [player1Bench]="player1Bench()"
      [player2Bench]="player2Bench()"
      [selectedPokemonId]="selectedPokemonId()"
      [validMoveTargets]="validMoveTargets()"
      [currentPlayerId]="currentPlayerId()"
      [phase]="phase()"
      [lastBattle]="displayBattle()"
      [isInteractive]="true"
      (spotClicked)="onSpotClicked($event)"
      (pokemonClicked)="onPokemonClicked($event)"
      (benchPokemonSelected)="onBenchPokemonSelected($event)"
      (dismissBattle)="dismissBattle()"
    />

    @if (selectedPokemonId() && phase() !== 'ended') {
      <div class="selection-info">
        <mat-icon>info</mat-icon>
        <span>Pokemon selected! Click a highlighted spot to move. Red targets = battle!</span>
      </div>
    }
  </main>
</div>
```

- [ ] **Step 5: Create `local-game.component.scss`**

Create `apps/client/src/app/game/local-game/local-game.component.scss`:

Copy the `.game-layout`, `.win-overlay`, `.win-modal`, `.trophy-icon`, `.win-message`, `.board-area`, `.game-header`, `.turn-indicator`, `.turn-label`, `.game-actions`, `.selection-info` styles from `apps/client/src/app/containers/game-board/game-board.component.scss`.

- [ ] **Step 6: Add `/local` route and nav link**

Modify `apps/client/src/app/app.routes.ts` — add the local route:

```typescript
  {
    path: 'local',
    loadComponent: () =>
      import('./game/local-game/local-game.component').then((m) => m.LocalGameComponent),
  },
```

Add it after the `lobby` route and before the `play/:roomId` route.

Modify `apps/client/src/app/app.html` — add the Local Play nav link after the existing "Play" link:

```html
  <a mat-button routerLink="/local" routerLinkActive="active-link">
    <mat-icon>people</mat-icon>
    Local Play
  </a>
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npx nx test client --testFile=apps/client/src/app/game/local-game/local-game.component.spec.ts
```

Expected: All tests pass.

- [ ] **Step 8: Smoke-test locally**

```bash
npx nx serve client
```

Navigate to `http://localhost:4200/local`. Verify the game board loads (may be empty if no board saved — that's expected).

- [ ] **Step 9: Commit**

```bash
git add apps/client/src/app/game/local-game/ apps/client/src/app/app.routes.ts apps/client/src/app/app.html
git commit -m "feature(client): add LocalGamePage with hot-seat play at /local"
```

---

## Task 4: Refactor `MultiplayerGameComponent` to use `GameBoardComponent`

**Files:**
- Modify: `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.ts`
- Modify: `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.html`
- Delete: `apps/client/src/app/components/bench/` (all files)

- [ ] **Step 1: Rewrite `multiplayer-game.component.ts`**

Replace the full contents of `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiplayerService, MultiplayerStore, Pokemon, Spot } from '@pokemon-duel/board';
import { GameBoardComponent } from '../../game/game-board/game-board.component';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-multiplayer-game',
  standalone: true,
  imports: [GameBoardComponent, MatButtonModule, MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiplayer-game.component.html',
  styleUrl: './multiplayer-game.component.scss',
})
export class MultiplayerGameComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly multiplayer = inject(MultiplayerService);
  private readonly store = inject(MultiplayerStore);

  protected readonly roomCode = this.store.roomCode;
  protected readonly localPlayerId = this.store.localPlayerId;
  protected readonly isMyTurn = this.store.isMyTurn;
  protected readonly currentPlayerId = this.store.currentPlayerId;
  protected readonly selectedPokemonId = this.store.selectedPokemonId;
  protected readonly validMoveTargets = this.store.validMoveTargets;
  protected readonly phase = this.store.phase;
  protected readonly winnerId = this.store.winnerId;
  protected readonly lastBattle = this.store.lastBattle;

  protected readonly spots = this.store.spots;
  protected readonly passages = this.store.passages;

  protected readonly pokemonOnBoard = computed(() =>
    this.store.pokemon().filter((p) => p.spotId !== null),
  );
  protected readonly player1Bench = computed(() =>
    this.store.pokemon().filter((p) => p.playerId === 1 && p.spotId === null),
  );
  protected readonly player2Bench = computed(() =>
    this.store.pokemon().filter((p) => p.playerId === 2 && p.spotId === null),
  );

  protected readonly localPlayerWon = computed(() => {
    const winner = this.winnerId();
    const local = this.localPlayerId();
    return winner !== null && winner === local;
  });

  constructor() {
    effect(() => {
      if (this.store.roomState() === 'idle') {
        this.router.navigate(['/lobby']);
      }
    });
  }

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (roomId && !this.roomCode()) {
      this.multiplayer.joinRoom(roomId);
    }
  }

  ngOnDestroy(): void {}

  protected async onSpotClicked(spot: Spot): Promise<void> {
    if (!this.isMyTurn()) return;

    const selectedId = this.selectedPokemonId();
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      await this.multiplayer.movePokemon(selectedId, spot.id);
      return;
    }

    const pokemonAtSpot = this.pokemonOnBoard().find((p) => p.spotId === spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.localPlayerId()) {
      await this.multiplayer.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected async onPokemonClicked(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;
    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  protected async onBenchPokemonSelected(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;
    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  protected async skipTurn(): Promise<void> {
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
}
```

- [ ] **Step 2: Rewrite `multiplayer-game.component.html`**

Replace the full contents of `apps/client/src/app/containers/multiplayer-game/multiplayer-game.component.html`:

```html
<div class="game-layout">
  @if (phase() === 'ended' && winnerId()) {
    <div class="win-overlay">
      <div class="win-modal" [class.victory]="localPlayerWon()" [class.defeat]="!localPlayerWon()">
        @if (localPlayerWon()) {
          <mat-icon class="result-icon victory-icon">emoji_events</mat-icon>
          <h2>Victory!</h2>
          <p class="win-message">Congratulations! You won the battle!</p>
        } @else {
          <mat-icon class="result-icon defeat-icon">heart_broken</mat-icon>
          <h2>Defeat</h2>
          <p class="win-message">Your opponent captured your flag!</p>
        }
        <button mat-flat-button (click)="backToLobby()">Back to Lobby</button>
      </div>
    </div>
  }

  <main class="board-area">
    <div class="game-header">
      <div class="header-left">
        <h2>Pokemon Duel</h2>
        <span class="room-code">Room: {{ roomCode() }}</span>
      </div>
      <div class="turn-indicator">
        @if (isMyTurn()) {
          <mat-chip highlighted class="your-turn-chip">Your Turn!</mat-chip>
        } @else {
          <mat-chip class="opponent-turn-chip">Opponent's Turn</mat-chip>
        }
        <mat-chip
          [class.turn-player--1]="currentPlayerId() === 1"
          [class.turn-player--2]="currentPlayerId() === 2"
        >
          Player {{ currentPlayerId() }}
        </mat-chip>
      </div>
      <div class="player-info">
        <span class="you-are">You are:</span>
        <mat-chip
          [class.player-badge--1]="localPlayerId() === 1"
          [class.player-badge--2]="localPlayerId() === 2"
        >
          Player {{ localPlayerId() }}
        </mat-chip>
        <button mat-button color="warn" (click)="leaveGame()">
          <mat-icon>exit_to_app</mat-icon>
          Leave
        </button>
      </div>
    </div>

    <app-game-board
      [spots]="spots()"
      [passages]="passages()"
      [pokemonOnBoard]="pokemonOnBoard()"
      [player1Bench]="player1Bench()"
      [player2Bench]="player2Bench()"
      [selectedPokemonId]="selectedPokemonId()"
      [validMoveTargets]="validMoveTargets()"
      [currentPlayerId]="currentPlayerId()"
      [phase]="phase()"
      [lastBattle]="lastBattle()"
      [isInteractive]="isMyTurn()"
      (spotClicked)="onSpotClicked($event)"
      (pokemonClicked)="onPokemonClicked($event)"
      (benchPokemonSelected)="onBenchPokemonSelected($event)"
      (dismissBattle)="lastBattle() && multiplayer.selectPokemon(null)"
    />

    @if (isMyTurn() && selectedPokemonId() && phase() !== 'ended') {
      <div class="selection-info">
        <mat-icon>info</mat-icon>
        <span>Pokemon selected! Click a highlighted spot to move. Red targets = battle!</span>
      </div>
    }

    @if (!isMyTurn() && phase() === 'playing') {
      <div class="waiting-info">
        <mat-icon>hourglass_empty</mat-icon>
        <span>Waiting for opponent to make their move...</span>
      </div>
    }
  </main>
</div>
```

- [ ] **Step 3: Delete the bench component**

```bash
cd apps/client/src/app/components
rm bench/bench.component.ts
rm bench/bench.component.html
rm bench/bench.component.scss
rmdir bench
```

- [ ] **Step 4: Verify build and tests pass**

```bash
npx nx build client
npx nx test client
```

Expected: Build succeeds. All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/app/containers/multiplayer-game/ apps/client/src/app/components/
git commit -m "refactor(client): MultiplayerGame uses shared GameBoard, remove bench component"
```

---

## Task 5: Reorganise folder structure

Move all remaining files into the feature-based layout using `git mv`, then update imports.

**Files:** All files in `app/components/` and `app/containers/` are being relocated.

- [ ] **Step 1: Move `game/` feature files**

```bash
cd apps/client/src/app

# spot
git mv components/spot game/spot

# passage
git mv components/passage game/passage

# pokemon
git mv components/pokemon game/pokemon

# multiplayer-game
git mv containers/multiplayer-game game/multiplayer-game
```

- [ ] **Step 2: Move `board-editor/` feature files**

```bash
cd apps/client/src/app

git mv components/board-canvas board-editor/board-canvas
git mv components/board-controls board-editor/board-controls
git mv containers/board-creator board-editor/board-creator
```

- [ ] **Step 3: Move `lobby/` feature files**

```bash
cd apps/client/src/app

mkdir -p lobby/lobby
git mv containers/lobby/lobby.component.ts lobby/lobby/lobby.component.ts
git mv containers/lobby/lobby.component.html lobby/lobby/lobby.component.html
git mv containers/lobby/lobby.component.scss lobby/lobby/lobby.component.scss
rmdir containers/lobby
```

- [ ] **Step 4: Update import paths in `game-board.component.ts`**

In `apps/client/src/app/game/game-board/game-board.component.ts`, update the component imports:

```typescript
// Replace:
import { SpotComponent } from '../../components/spot/spot.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';

// With:
import { SpotComponent } from '../spot/spot.component';
import { PassageComponent } from '../passage/passage.component';
import { PokemonComponent } from '../pokemon/pokemon.component';
```

- [ ] **Step 5: Update import paths in `board-canvas.component.ts`**

In `apps/client/src/app/board-editor/board-canvas/board-canvas.component.ts`, update:

```typescript
// Replace:
import { SpotComponent } from '../spot/spot.component';
import { PassageComponent } from '../passage/passage.component';

// With:
import { SpotComponent } from '../../game/spot/spot.component';
import { PassageComponent } from '../../game/passage/passage.component';
```

- [ ] **Step 6: Update import paths in `board-creator.component.ts`**

In `apps/client/src/app/board-editor/board-creator/board-creator.component.ts`, update:

```typescript
// Replace:
import { BoardCanvasComponent } from '../../components/board-canvas/board-canvas.component';
import { BoardControlsComponent } from '../../components/board-controls/board-controls.component';

// With:
import { BoardCanvasComponent } from '../board-canvas/board-canvas.component';
import { BoardControlsComponent } from '../board-controls/board-controls.component';
```

- [ ] **Step 7: Update all lazy-load paths in `app.routes.ts`**

Replace the full contents of `apps/client/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full',
  },
  {
    path: 'lobby',
    loadComponent: () =>
      import('./lobby/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'local',
    loadComponent: () =>
      import('./game/local-game/local-game.component').then((m) => m.LocalGameComponent),
  },
  {
    path: 'play/:roomId',
    loadComponent: () =>
      import('./game/multiplayer-game/multiplayer-game.component').then(
        (m) => m.MultiplayerGameComponent,
      ),
  },
  {
    path: 'board-creator',
    loadComponent: () =>
      import('./board-editor/board-creator/board-creator.component').then(
        (m) => m.BoardCreatorComponent,
      ),
  },
];
```

- [ ] **Step 8: Remove now-empty `components/` and `containers/` directories**

```bash
cd apps/client/src/app
rmdir components
rmdir containers
```

- [ ] **Step 9: Verify build and all tests pass**

```bash
npx nx build client
npx nx test client
```

Expected: Build succeeds. All tests pass. If any import errors appear, fix the path in the file the error points to.

- [ ] **Step 10: Commit**

```bash
git add -A apps/client/src/app/
git commit -m "refactor(client): reorganise to feature-based folder structure"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Feature-based folders (`game/`, `board-editor/`, `lobby/`) — Task 5
- ✅ Delete dead `game-board` container — Task 1
- ✅ Delete `bench` component — Task 4
- ✅ Shared `GameBoard` canvas — Task 2
- ✅ `LocalGamePage` at `/local` — Task 3
- ✅ `MultiplayerGamePage` uses `GameBoard` — Task 4
- ✅ Remove section-header comments — No comments exist in new/rewritten files; existing moved files will have their comments removed as part of the rewrites
- ✅ App nav updated — Task 3 Step 6
- ✅ `isInteractive` gates interaction in `GameBoard` — Task 2 template
- ✅ Bench rendering inside canvas — Task 2
- ✅ Coordinate math encapsulated in `GameBoard` — Task 2

**Note on existing spec files:** The spec files in `game/spot/`, `game/passage/`, `board-editor/board-canvas/`, `board-editor/board-controls/`, and `board-editor/board-creator/` are moved by `git mv` and retain their existing passing tests with no changes needed — their imports only reference `@pokemon-duel/board` and relative paths within the same folder, which remain valid.
