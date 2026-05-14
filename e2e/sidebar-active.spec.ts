import { test, expect, Page } from '@playwright/test';
import { withAuthState } from './fixtures/mockSupabase';

/**
 * Reads the active `data-nav-item` values within a CSS scope. We assert
 * per-surface (sidebar vs TopNav) because TopNav and the dashboard sidebar
 * legitimately surface different item sets — TopNav has no Assets tab, so
 * on /dashboard/assets it highlights its longest available ancestor
 * (/dashboard) while the sidebar highlights /dashboard/assets.
 */
async function activeItemsIn(page: Page, scope: string): Promise<string[]> {
  return await page.$$eval(
    `${scope} [data-nav-item][data-active="true"]`,
    (els) =>
      Array.from(new Set(els.map((e) => e.getAttribute('data-nav-item')!))).sort()
  );
}

const SIDEBAR = 'aside';
const TOPNAV = 'header';

test.describe('nav active highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');
  });

  test('/dashboard highlights only Dashboard in sidebar AND TopNav', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard$/);
    await page.waitForSelector(`${SIDEBAR} [data-nav-item]`);

    expect(await activeItemsIn(page, SIDEBAR)).toEqual(['/dashboard']);
    expect(await activeItemsIn(page, TOPNAV)).toEqual(['/dashboard']);
  });

  test('/dashboard/assets: sidebar picks Assets (longest-prefix), TopNav stays on Dashboard', async ({ page }) => {
    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);
    await page.waitForSelector(`${SIDEBAR} [data-nav-item][data-active="true"]`);

    // Sidebar: Assets only — Dashboard must NOT also light up (longest-prefix).
    expect(await activeItemsIn(page, SIDEBAR)).toEqual(['/dashboard/assets']);
    // TopNav has no Assets tab, so /dashboard is its longest available match.
    expect(await activeItemsIn(page, TOPNAV)).toEqual(['/dashboard']);
  });

  test('deep link /dashboard//assets// normalizes to /dashboard/assets', async ({ page }) => {
    await page.goto('/dashboard//assets//');
    await page.waitForSelector(`${SIDEBAR} [data-nav-item][data-active="true"]`);

    expect(await activeItemsIn(page, SIDEBAR)).toEqual(['/dashboard/assets']);
    expect(await activeItemsIn(page, TOPNAV)).toEqual(['/dashboard']);
  });

  test('transition /dashboard → /dashboard/assets swaps sidebar active item cleanly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector(`${SIDEBAR} [data-nav-item][data-active="true"]`);
    expect(await activeItemsIn(page, SIDEBAR)).toEqual(['/dashboard']);

    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);
    await expect(
      page.locator(`${SIDEBAR} [data-nav-item="/dashboard/assets"][data-active="true"]`)
    ).toBeVisible();

    expect(await activeItemsIn(page, SIDEBAR)).toEqual(['/dashboard/assets']);
  });
});
