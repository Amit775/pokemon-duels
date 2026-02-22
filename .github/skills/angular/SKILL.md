---
name: angular
description: "Angular patterns and conventions for this project. USE WHEN writing Angular components, working with signals, inputs/outputs, control flow, or any Angular-related code. EXAMPLES: 'create a component', 'add an input', 'use signals', '@if syntax', 'zoneless change detection'."
---

# Angular Development Patterns

This project uses **Angular 21+** with modern patterns. Follow these conventions strictly.

## Signal-Based Inputs/Outputs (Required)

Always use signal-based inputs and outputs, never decorators.

```typescript
import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data(); as d) {
      <div (click)="clicked.emit(d)">{{ d.name }}</div>
    }
  `
})
export class ExampleComponent {
  // Required input
  data = input.required<Data>();
  
  // Optional input with default
  enabled = input(true);
  
  // Output signal
  clicked = output<Data>();
  
  // Computed signal
  displayName = computed(() => this.data().name.toUpperCase());
  
  // Service injection
  private readonly service = inject(DataService);
}
```

**NEVER use these patterns:**
```typescript
// ❌ DO NOT USE decorators
@Input() data!: Data;
@Output() clicked = new EventEmitter<Data>();

// ❌ DO NOT USE constructor injection
constructor(private service: DataService) {}
```

## Control Flow Syntax

Always use built-in control flow, never structural directives.

```html
<!-- ✅ @if -->
@if (condition) {
  <div>Content</div>
} @else if (other) {
  <div>Other</div>
} @else {
  <div>Fallback</div>
}

<!-- ✅ @for with track -->
@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items</p>
}

<!-- ✅ @switch -->
@switch (status()) {
  @case ('active') { <span class="active">Active</span> }
  @case ('pending') { <span class="pending">Pending</span> }
  @default { <span>Unknown</span> }
}
```

**NEVER use:**
```html
<!-- ❌ DO NOT USE structural directives -->
<div *ngIf="condition">...</div>
<div *ngFor="let item of items">...</div>
```

## Component File Structure

Components use separate files with simple naming:
- `example.ts` - Component class
- `example.html` - Template
- `example.scss` - Styles

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
```

## Component Design Principles

Follow the [Angular Style Guide](https://angular.dev/style-guide) for maintainable, testable code:

### Single Responsibility
- **One component = one purpose.** If a component does multiple things, split it.
- **Extract reusable logic** into services or utility functions.
- **Keep templates under ~50 lines.** Extract child components if larger.

### Small, Focused Units
```typescript
// ❌ AVOID: Monolithic component
@Component({ selector: 'app-game-board' })
export class GameBoardComponent {
  // 500+ lines handling board, players, turns, chat, settings...
}

// ✅ PREFER: Composed from focused components
@Component({
  selector: 'app-game-board',
  template: `
    <app-board-grid [spots]="spots()" />
    <app-player-list [players]="players()" />
    <app-turn-indicator [currentPlayer]="currentPlayer()" />
    <app-game-controls (action)="handleAction($event)" />
  `
})
export class GameBoardComponent {
  // Orchestrates child components, minimal logic
}
```

### Service Extraction
```typescript
// ❌ AVOID: Business logic in component
export class LobbyComponent {
  async createRoom() {
    const roomId = this.generateId();
    await this.http.post('/api/rooms', { roomId });
    await this.signalR.joinGroup(roomId);
    // ...more logic
  }
}

// ✅ PREFER: Delegate to service
export class LobbyComponent {
  private readonly roomService = inject(RoomService);
  
  async createRoom() {
    await this.roomService.create();
  }
}
```

## State Management with @ngrx/signals

Use **@ngrx/signals** for component and feature state management:

```typescript
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

// Define the store
export const GameStore = signalStore(
  withState({
    players: [] as Player[],
    currentTurn: 0,
    status: 'waiting' as GameStatus,
  }),
  withComputed((store) => ({
    currentPlayer: computed(() => store.players()[store.currentTurn()]),
    isGameActive: computed(() => store.status() === 'playing'),
  })),
  withMethods((store) => ({
    addPlayer(player: Player) {
      patchState(store, { players: [...store.players(), player] });
    },
    nextTurn() {
      const next = (store.currentTurn() + 1) % store.players().length;
      patchState(store, { currentTurn: next });
    },
    startGame() {
      patchState(store, { status: 'playing' });
    },
  }))
);

// Use in component
@Component({
  providers: [GameStore],
})
export class GameComponent {
  readonly store = inject(GameStore);
  
  // Access state
  players = this.store.players;
  currentPlayer = this.store.currentPlayer;
  
  // Call methods
  onStart() {
    this.store.startGame();
  }
}
```

## Key APIs

| API | Purpose | Example |
|-----|---------|---------|
| `input()` | Optional input | `name = input('')` |
| `input.required()` | Required input | `id = input.required<number>()` |
| `output()` | Output events | `clicked = output<T>()` |
| `computed()` | Derived state | `computed(() => ...)` |
| `linkedSignal()` | Two-way binding | `linkedSignal(() => initial)` |
| `resource()` | Async data | `resource({ loader: () => fetch(...) })` |
| `inject()` | DI injection | `inject(Service)` |

## Avoid `effect()` - Prefer Declarative Patterns

`effect()` should be a **last resort**. Most use cases are better served by declarative alternatives:

```typescript
// ❌ AVOID: Imperative effect for derived state
effect(() => {
  this.displayName = this.data().name.toUpperCase();
});

// ✅ PREFER: Declarative computed signal
displayName = computed(() => this.data().name.toUpperCase());

// ❌ AVOID: Effect for API calls
effect(() => {
  this.http.get(`/api/items/${this.id()}`).subscribe(...);
});

// ✅ PREFER: resource() for async data
items = resource({
  request: () => this.id(),
  loader: ({ request: id }) => this.http.get(`/api/items/${id}`)
});

// ❌ AVOID: Effect for form sync
effect(() => {
  this.form.patchValue({ name: this.data().name });
});

// ✅ PREFER: linkedSignal for two-way binding
formName = linkedSignal(() => this.data().name);
```

**When `effect()` IS appropriate:**
- Logging/analytics that don't affect state
- Third-party library integration (charts, maps)
- DOM manipulation outside Angular's control

## Running Angular Commands

```bash
# Serve client
pnpm nx serve client

# Build for production
pnpm nx build client --configuration=production

# Run tests
pnpm nx test client

# Generate component (use nx-generate skill)
pnpm nx g @nx/angular:component my-component --project=client
```

## Detailed Reference

For complete patterns, read `.claude/instructions/angular.md` or `apps/docs/src/content/agents/patterns/angular.md`.
