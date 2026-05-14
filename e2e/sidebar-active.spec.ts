import { test, expect, Page } from '@playwright/test';
import { withAuthState } from './fixtures/mockSupabase';

/**
 * Reads every nav link's `data-nav-item` + `data-active` attribute from the
 * page so we can assert the *exact* set of items currently highlighted.
 * Covers both the DashboardLayout sidebar and TopNav (both surfaces tag
 * their items with `data-nav-item`).
 */
async function readActiveItems(page: Page): Promise<string[]> {
  return await page.$$eval('[data-nav-item][data-active="true"]', (els) =>
    Array.from(new Set(els.map((e) => e.getAttribute('data-nav-item')!))).sort()
  );
}

test.describe('nav active highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');
  });

  test('/dashboard highlights only Dashboard in every nav surface', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard$/);
    await page.waitForSelector('[data-nav-item]');

    expect(await readActiveItems(page)).toEqual(['/dashboard']);
  });

  test('/dashboard/assets highlights only Assets (longest-prefix wins)', async ({ page }) => {
    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);
    await page.waitForSelector('[data-nav-item]');

    const active = await readActiveItems(page);

    // Sidebar must pick the most specific item; Dashboard must NOT also light up.
    expect(active).toContain('/dashboard/assets');
    expect(active).not.toContain('/dashboard');
  });

  test('deep link with messy slashes still resolves to the right item', async ({ page }) => {
    // normalizePath collapses // and trims trailing /, so this should behave
    // identically to /dashboard/assets.
    await page.goto('/dashboard//assets//');
    await page.waitForSelector('[data-nav-item]');

    const active = await readActiveItems(page);
    expect(active).toContain('/dashboard/assets');
    expect(active).not.toContain('/dashboard');
  });

  test('transition /dashboard → /dashboard/assets swaps the active item cleanly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-nav-item]');
    expect(await readActiveItems(page)).toEqual(['/dashboard']);

    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);
    await page.waitForSelector('[data-nav-item][data-active="true"]');

    const active = await readActiveItems(page);
    expect(active).toContain('/dashboard/assets');
    expect(active).not.toContain('/dashboard');
  });
});
