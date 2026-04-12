import { test, expect } from '@playwright/test';

test.describe('Local Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/local');
  });

  test('navigates to local game page', async ({ page }) => {
    await expect(page).toHaveURL(/\/local/);
  });

  test('shows game header with Pokemon Duel title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Pokemon Duel/i })).toBeVisible();
  });

  test('shows turn indicator', async ({ page }) => {
    await expect(page.getByTestId('turn-indicator')).toBeVisible();
  });

  test('shows Skip Turn button', async ({ page }) => {
    await expect(page.getByTestId('skip-turn-btn')).toBeVisible();
  });

  test('shows Reset button', async ({ page }) => {
    await expect(page.getByTestId('reset-game-btn')).toBeVisible();
  });

  test('Skip Turn button advances to player 2', async ({ page }) => {
    // Initially it should be Player 1's turn
    await expect(page.getByTestId('turn-indicator')).toContainText('Player 1');

    // Click Skip Turn
    await page.getByTestId('skip-turn-btn').click();

    // Now it should be Player 2's turn
    await expect(page.getByTestId('turn-indicator')).toContainText('Player 2');
  });

  test('win overlay is not visible initially', async ({ page }) => {
    await expect(page.getByTestId('win-overlay')).not.toBeVisible();
  });
});
