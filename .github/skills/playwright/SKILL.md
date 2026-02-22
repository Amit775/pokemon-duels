---
name: playwright
description: "Playwright E2E testing patterns. USE WHEN writing e2e tests, debugging test failures, or configuring Playwright. EXAMPLES: 'write e2e test', 'playwright selector', 'run e2e', 'debug test', 'page object'."
---

# Playwright E2E Testing

End-to-end tests use **Playwright** for browser automation.

## Project Structure

```
apps/client/
├── playwright.config.ts    # Playwright configuration
├── e2e/
│   ├── app.spec.ts         # Basic app tests
│   └── multiplayer.spec.ts # Multiplayer flow tests
├── playwright-report/      # HTML test reports
└── test-results/           # Test artifacts
```

## Running Tests

```bash
# Run all e2e tests
pnpm nx e2e client

# Run with UI mode (interactive)
pnpm nx e2e client -- --ui

# Run specific test file
pnpm nx e2e client -- e2e/multiplayer.spec.ts

# Run specific test by name
pnpm nx e2e client -- -g "should create room"

# Debug mode (opens browser with inspector)
pnpm nx e2e client -- --debug

# Generate test from recording
pnpm nx e2e client -- --codegen
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Game Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display game board', async ({ page }) => {
    await expect(page.getByTestId('game-board')).toBeVisible();
  });

  test('should create room and get room ID', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Room' }).click();
    
    const roomId = page.getByTestId('room-id');
    await expect(roomId).toBeVisible();
    await expect(roomId).toHaveText(/^[A-Z0-9]{6}$/);
  });

  test('should join existing room', async ({ page, context }) => {
    // Create room in first tab
    await page.getByRole('button', { name: 'Create Room' }).click();
    const roomId = await page.getByTestId('room-id').textContent();
    
    // Join from second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.getByPlaceholder('Room ID').fill(roomId!);
    await page2.getByRole('button', { name: 'Join' }).click();
    
    await expect(page2.getByTestId('game-board')).toBeVisible();
  });
});
```

## Selector Best Practices

```typescript
// ✅ Best: data-testid (most stable)
page.getByTestId('game-board')

// ✅ Good: accessible role + name
page.getByRole('button', { name: 'Create Room' })
page.getByRole('heading', { name: 'Welcome' })

// ✅ Good: label/placeholder
page.getByLabel('Room ID')
page.getByPlaceholder('Enter room code')

// ✅ Good: text content
page.getByText('Game Over')

// ⚠️ Avoid: CSS selectors (fragile)
page.locator('.game-board')
page.locator('#room-id')
```

## Common Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('expected');
await expect(element).toContainText('partial');

// Attributes
await expect(element).toHaveAttribute('disabled');
await expect(element).toHaveClass(/active/);

// Count
await expect(page.getByTestId('spot')).toHaveCount(10);

// URL
await expect(page).toHaveURL(/\/game\//);
```

## Page Object Pattern

```typescript
// e2e/pages/lobby.page.ts
export class LobbyPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async createRoom() {
    await this.page.getByRole('button', { name: 'Create Room' }).click();
  }

  async joinRoom(roomId: string) {
    await this.page.getByPlaceholder('Room ID').fill(roomId);
    await this.page.getByRole('button', { name: 'Join' }).click();
  }

  getRoomId() {
    return this.page.getByTestId('room-id');
  }
}

// e2e/multiplayer.spec.ts
test('create and join room', async ({ page }) => {
  const lobby = new LobbyPage(page);
  await lobby.goto();
  await lobby.createRoom();
  await expect(lobby.getRoomId()).toBeVisible();
});
```

## Configuration

`playwright.config.ts`:
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx nx serve client',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});
```

## Detailed Reference

For testing guidelines, read `.claude/instructions/testing.md`.
