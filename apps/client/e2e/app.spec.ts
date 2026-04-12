import { test, expect } from '@playwright/test';

test.describe('App navigation', () => {
  test('redirects root path to lobby', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/lobby/);
  });

  test('lobby page has correct title', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page).toHaveTitle(/client/i);
  });

  test('displays Pokemon Duel heading on lobby page', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page.locator('h1')).toContainText('Pokemon Duel');
  });

  test('shows Create Room button on lobby page', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page.getByRole('button', { name: /Create New Room/i })).toBeVisible();
  });

  test('shows Join Room input on lobby page', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page.getByLabel('Room Code')).toBeVisible();
  });

  test('shows nav bar with game links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Create Board/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Local Play/i })).toBeVisible();
  });

  test('navigates to board creator page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Create Board/i }).click();
    await expect(page).toHaveURL(/\/board-creator/);
  });

  test('navigates to local play page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Local Play/i }).click();
    await expect(page).toHaveURL(/\/local/);
  });
});

test.describe('Lobby UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lobby');
  });

  test('Join button is disabled when room code is empty', async ({ page }) => {
    const joinButton = page.getByRole('button', { name: /^Join$/i });
    await expect(joinButton).toBeDisabled();
  });

  test('Join button enables after entering a room code', async ({ page }) => {
    await page.getByLabel('Room Code').fill('ABCD');
    const joinButton = page.getByRole('button', { name: /^Join$/i });
    await expect(joinButton).toBeEnabled();
  });

  test('input auto-uppercases entered room code', async ({ page }) => {
    const input = page.getByLabel('Room Code');
    await input.fill('abcd');
    // The component's (input) handler uppercases the value
    await expect(input).toHaveValue('ABCD');
  });

  test('shows connection status indicator', async ({ page }) => {
    await expect(page.locator('.connection-status')).toBeVisible();
  });
});
