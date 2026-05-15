import { test, expect } from '@playwright/test';
import { withAuthState, readConsoleErrors } from './fixtures/mockSupabase';

/**
 * After a full browser reload while authenticated, the app must restore
 * the Supabase session from storage and stay on the protected route —
 * never redirecting back to /login or rendering a login form.
 */

const ERROR_TEXT_PATTERN =
  /invalid (login|credentials)|incorrect|failed|error|something went wrong/i;

test.describe('session restoration on reload', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');
  });

  test('reloading /dashboard keeps the user on /dashboard with no login UI', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard$/);
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    // Sanity: not on a login form before reload.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    await page.reload();

    // After reload we must still land on /dashboard — no /login bounce.
    await page.waitForURL(/\/dashboard$/);
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    // Login form must not have rendered at any point we can observe.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    // The session must be live in the singleton client.
    const hasSession = await page.evaluate(async () => {
      const client = (globalThis as any).__fanrealms_supabase_client__;
      if (!client?.auth?.getSession) return false;
      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    });
    expect(hasSession).toBe(true);

    const errors = await readConsoleErrors(page);
    const authErrors = errors.filter((e) => ERROR_TEXT_PATTERN.test(e));
    expect(authErrors, `console auth errors: ${authErrors.join(' | ')}`).toEqual([]);
  });

  test('reloading a deep route (/dashboard/assets) restores session and stays put', async ({ page }) => {
    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);

    await page.reload();

    await page.waitForURL(/\/dashboard\/assets$/);
    expect(new URL(page.url()).pathname).toBe('/dashboard/assets');

    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    const hasSession = await page.evaluate(async () => {
      const client = (globalThis as any).__fanrealms_supabase_client__;
      if (!client?.auth?.getSession) return false;
      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    });
    expect(hasSession).toBe(true);
  });
});
