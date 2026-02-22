---
title: Angular Development Guide
slug: patterns/angular
description: Modern Angular patterns and conventions for this project
category: agents
---

# Angular Development Guide

This document defines the Angular patterns and conventions to follow throughout this project.

## Input/Output Signals (Angular 19+)

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
  // Required input (must be provided)
  spot = input.required<Spot>();
  
  // Optional input with default
  selected = input(false);
  
  // Output signal
  spotClicked = output<Spot>();
}
```

**Do NOT use:**
```typescript
// ❌ Old decorator pattern - DO NOT USE
@Input() spot!: Spot;
@Output() spotClicked = new EventEmitter<Spot>();
```

## Control Flow (@if, @for, @switch)

**Always use built-in control flow**, not structural directives.

```html
<!-- ✅ Modern control flow -->
@if (spot(); as s) {
  <div>{{ s.name }}</div>
}

@for (spot of spots(); track spot.id) {
  <app-spot [spot]="spot" />
} @empty {
  <p>No spots yet</p>
}

@switch (spot().metadata.type) {
  @case ('start') { <span class="start">Start</span> }
  @case ('end') { <span class="end">End</span> }
  @case ('warp') { <span class="warp">Warp</span> }
  @default { <span>Normal</span> }
}
```

**Do NOT use:**
```html
<!-- ❌ Old structural directives - DO NOT USE -->
<div *ngIf="spot">{{ spot.name }}</div>
<div *ngFor="let spot of spots; trackBy: trackBySpotId">
```

## Component Structure

```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  // 1. Inputs (signals)
  data = input.required<Data>();
  optional = input<string>('default');
  
  // 2. Outputs (signals)
  dataChanged = output<Data>();
  
  // 3. Injected services
  private readonly store = inject(ExampleStore);
  
  // 4. Computed signals
  computed = computed(() => this.data().value * 2);
  
  // 5. Methods
  onAction(): void {
    this.dataChanged.emit(this.data());
  }
}
```

## @ngrx/signals Store Pattern

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';

type State = {
  selectedId: string | null;
  isLoading: boolean;
};

const initialState: State = {
  selectedId: null,
  isLoading: false,
};

export const ExampleStore = signalStore(
  { providedIn: 'root' }, // or omit for component-level
  
  // State
  withState(initialState),
  
  // Entity collections
  withEntities({ entity: type<Item>(), collection: 'item' }),
  
  // Computed (derived signals) - use entityMap for O(1) lookups
  withComputed(({ itemEntityMap, itemEntities, selectedId }) => ({
    selectedItem: computed(() => {
      const id = selectedId();
      return id ? itemEntityMap()[id] : undefined;
    }),
    itemCount: computed(() => itemEntities().length),
  })),
  
  // Methods
  withMethods((store) => ({
    select(id: string): void {
      patchState(store, { selectedId: id });
    },
    addItem(item: Item): void {
      patchState(store, addEntity(item, { collection: 'item' }));
    },
    removeItem(id: string): void {
      patchState(store, removeEntity(id, { collection: 'item' }));
    },
  }))
);
```

## TDD Workflow

1. **Write failing test first**
2. **Implement minimum code to pass**
3. **Refactor if needed**
4. **Repeat**

### Store Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { ExampleStore } from './example.store';

describe('ExampleStore', () => {
  let store: InstanceType<typeof ExampleStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExampleStore],
    });
    store = TestBed.inject(ExampleStore);
  });

  it('should start with empty items', () => {
    expect(store.itemEntities()).toEqual([]);
    expect(store.itemCount()).toBe(0);
  });

  it('should add item', () => {
    const item = { id: '1', name: 'Test' };
    store.addItem(item);
    expect(store.itemEntities()).toContain(item);
  });
});
```

### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpotComponent } from './spot.component';

describe('SpotComponent', () => {
  let component: SpotComponent;
  let fixture: ComponentFixture<SpotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpotComponent);
    component = fixture.componentInstance;
  });

  it('should emit spotClicked on click', () => {
    const spot = { id: '1', name: 'Test', x: 0, y: 0, metadata: { type: 'normal' } };
    fixture.componentRef.setInput('spot', spot);
    fixture.detectChanges();

    const spy = jest.spyOn(component.spotClicked, 'emit');
    fixture.nativeElement.querySelector('.spot').click();
    
    expect(spy).toHaveBeenCalledWith(spot);
  });
});
```

## Type Modeling with Discriminated Unions

Use discriminated unions for type-safe variants:

```typescript
// Discriminated union for spot metadata
export type SpotMetadata =
  | { type: 'normal' }
  | { type: 'start' }
  | { type: 'end' }
  | { type: 'warp'; targetSpotId: string };

// Type guard
export function isWarpSpot(metadata: SpotMetadata): metadata is { type: 'warp'; targetSpotId: string } {
  return metadata.type === 'warp';
}

// Usage with narrowing
if (isWarpSpot(spot.metadata)) {
  console.log(spot.metadata.targetSpotId); // TypeScript knows this exists
}
```

## File Naming Conventions

- Components: `example.component.ts`, `example.component.html`, `example.component.scss`
- Stores: `example.store.ts`, `example.store.spec.ts`
- Services: `example.service.ts`, `example.service.spec.ts`
- Models: `example.models.ts` (types only, no logic)
- Utils: `example.utils.ts`, `example.utils.spec.ts`

## Folder Structure

```
feature/
  components/          # Presentational (dumb) components
    spot/
      spot.component.ts
      spot.component.html
      spot.component.scss
      spot.component.spec.ts
  containers/          # Smart components (inject stores)
    board-creator/
  store/               # @ngrx/signals stores
  services/            # API/persistence services
  models/              # TypeScript types/interfaces
  utils/               # Pure utility functions
```
