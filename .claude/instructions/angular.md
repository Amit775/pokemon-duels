# Angular Development Guidelines

This project uses **Angular 21+** with modern patterns. Follow these conventions strictly.

## Signal-Based Inputs/Outputs (Required)

**Always use signal-based inputs and outputs**, not decorators.

```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-spot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div (click)="spotClicked.emit(spot())">
      {{ spot().name }}
    </div>
  `
})
export class SpotComponent {
  // Required input
  spot = input.required<Spot>();
  
  // Optional input with default
  selected = input(false);
  
  // Output signal
  spotClicked = output<Spot>();
}
```

**❌ Never use decorators:**
```typescript
// DO NOT USE
@Input() spot!: Spot;
@Output() spotClicked = new EventEmitter<Spot>();
```

## Control Flow (@if, @for, @switch)

**Always use built-in control flow**, not structural directives.

```html
<!-- ✅ Correct -->
@if (spot(); as s) {
  <div>{{ s.name }}</div>
}

@for (spot of spots(); track spot.id) {
  <app-spot [spot]="spot" />
} @empty {
  <p>No spots</p>
}

@switch (type()) {
  @case ('start') { <span>Start</span> }
  @default { <span>Normal</span> }
}
```

**❌ Never use structural directives:**
```html
<!-- DO NOT USE -->
<div *ngIf="spot">{{ spot.name }}</div>
<div *ngFor="let spot of spots">
```

## Component Structure

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
export class ExampleComponent {
  // 1. Inputs (signals)
  data = input.required<Data>();
  
  // 2. Outputs (signals)
  dataChanged = output<Data>();
  
  // 3. Injected services (use inject())
  private readonly store = inject(ExampleStore);
  
  // 4. Computed signals
  derivedValue = computed(() => this.data().value * 2);
  
  // 5. Methods
  handleClick() { ... }
}
```

## Key Patterns

| Pattern | Use |
|---------|-----|
| `inject()` | Service injection (not constructor) |
| `computed()` | Derived state from signals |
| `effect()` | Side effects from signal changes |
| `linkedSignal()` | Two-way binding with signals |
| `resource()` | Async data fetching |

## File Naming

- Components: `example.ts`, `example.html`, `example.scss`
- Services: `example.service.ts`
- Models: `example.model.ts`
- Stores: `example.store.ts`

## Detailed Guide

See [004-angular-development-guide.md](apps/docs/src/content/agents/004-angular-development-guide.md) for complete patterns.
