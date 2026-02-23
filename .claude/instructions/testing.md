# Testing Guidelines

## Unit Testing (Vitest)

Unit tests use **Vitest** with Angular testing utilities.

### Running Tests

```bash
# Test specific project
npx nx test board
npx nx test client

# Test all projects
npx nx run-many -t test

# Watch mode
npx nx test board --watch

# With coverage
npx nx test board --coverage
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

describe('SpotComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotComponent],
    }).compileComponents();
  });

  it('should display spot name', () => {
    const fixture = TestBed.createComponent(SpotComponent);
    fixture.componentRef.setInput('spot', { id: 1, name: 'Test' });
    fixture.detectChanges();
    
    expect(fixture.nativeElement.textContent).toContain('Test');
  });
});
```

## E2E Testing (Playwright)

End-to-end tests use **Playwright** for browser automation.

### Running E2E Tests

```bash
# Run e2e tests
npx nx e2e client

# With UI mode
npx nx e2e client -- --ui

# Specific test file
npx nx e2e client -- e2e/multiplayer.spec.ts

# Debug mode
npx nx e2e client -- --debug
```

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Game Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display board', async ({ page }) => {
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('should create room', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Room' }).click();
    await expect(page.getByTestId('room-id')).toBeVisible();
  });
});
```

### Playwright Config

Located at `apps/client/playwright.config.ts`:
- Tests in `apps/client/e2e/`
- Reports in `apps/client/playwright-report/`
- Auto-starts dev server on `:4200`

### Best Practices

| Practice | Description |
|----------|-------------|
| `data-testid` | Use for stable selectors |
| `getByRole` | Prefer accessible queries |
| `toBeVisible` | Assert visibility, not existence |
| Page Objects | Extract reusable page interactions |
| `test.describe` | Group related tests |
