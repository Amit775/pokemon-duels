# Angular Development Rules

This project uses **Angular 21+** with modern patterns. Follow these conventions strictly.

## Signal-Based Inputs/Outputs (Required)

**Always** use signal-based inputs and outputs. **Never** use decorators.

```typescript
// ✅ Required
spot = input.required<Spot>();
selected = input(false);
spotClicked = output<Spot>();
```

```typescript
// ❌ Never use
@Input() spot!: Spot;
@Output() spotClicked = new EventEmitter<Spot>();
constructor(private service: DataService) {}
```

Use `inject()` for dependency injection, never constructor injection.

## Control Flow (Required)

**Always** use built-in control flow. **Never** use structural directives.

```html
<!-- ✅ Required -->
@if (condition) { ... } @else { ... }
@for (item of items(); track item.id) { ... } @empty { ... }
@switch (type()) { @case ('x') { ... } @default { ... } }
```

```html
<!-- ❌ Never use -->
<div *ngIf="...">
<div *ngFor="let item of items">
```

## Component Structure

- `ChangeDetectionStrategy.OnPush` — always
- `standalone: true` — always
- Separate files: `example.ts`, `example.html`, `example.scss`
- Injection: `private readonly x = inject(X)` at class level
- Order: inputs → outputs → injected services → computed signals → methods

## Component Design

- One component = one purpose. Split if it does multiple things.
- Keep templates under ~50 lines. Extract child components if larger.
- Business logic belongs in services, not components.

## State Management

Use **@ngrx/signals** (`signalStore`, `withState`, `withMethods`, `withComputed`) for component and feature state.

## Key APIs

| API | Purpose |
|-----|---------|
| `input()` / `input.required()` | Component inputs |
| `output()` | Component outputs |
| `computed()` | Derived state |
| `linkedSignal()` | Two-way binding |
| `resource()` | Async data fetching |
| `inject()` | Dependency injection |

## Avoid `effect()`

`effect()` is a last resort. Prefer:
- `computed()` for derived state
- `resource()` for async data
- `linkedSignal()` for form sync

`effect()` is appropriate only for: logging/analytics, third-party library integration, DOM manipulation outside Angular's control.

## File Naming

- Components: `example.ts`, `example.html`, `example.scss`
- Services: `example.service.ts`
- Models: `example.model.ts`
- Stores: `example.store.ts`

For implementation patterns, invoke the `angular` skill.
