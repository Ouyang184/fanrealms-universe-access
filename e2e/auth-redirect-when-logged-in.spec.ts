import { test, expect, Page } from '@playwright/test';
import { withAuthState, readConsoleErrors } from './fixtures/mockSupabase';

/**
 * When already authenticated, hitting /login or /signup must bounce
 * straight to the post-auth destination — without ever flashing a login
 * form, an error toast, or surfacing an auth error in the console.
 */

const ERROR_TEXT_PATTERN =
  /invalid (login|credentials)|incorrect|failed|error|something went wrong/i;

async function assertNoVisibleAuthError(page: Page) {
  // Toasts (sonner / shadcn) commonly render with role="status" or "alert".
  const alerts = page.locator('[role="alert"], [role="status"], .sonner-toast, [data-sonner-toast]');
  const count = await alerts.count();
  for (let i = 0; i < count; i++) {
    const text = (await alerts.nth(i).textContent())?.trim() ?? '';
    expect(
      text,
      `unexpected error-like toast/alert visible: "${text}"`
    ).not.toMatch(ERROR_TEXT_PATTERN);
  }
}

test.describe('logged-in auth-page redirects', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');
  });

  test('/login redirects to /dashboard with no error UI or console errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL(/\/dashboard$/);
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    // Login form must not have rendered.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    await assertNoVisibleAuthError(page);

    const errors = await readConsoleErrors(page);
    const authErrors = errors.filter((e) => ERROR_TEXT_PATTERN.test(e));
    expect(authErrors, `console auth errors: ${authErrors.join(' | ')}`).toEqual([]);
  });

  test('/signup redirects to /dashboard with no error UI or console errors', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForURL(/\/dashboard$/);
    expect(new URL(page.url()).pathname).toBe('/dashboard');

    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    await assertNoVisibleAuthError(page);

    const errors = await readConsoleErrors(page);
    const authErrors = errors.filter((e) => ERROR_TEXT_PATTERN.test(e));
    expect(authErrors, `console auth errors: ${authErrors.join(' | ')}`).toEqual([]);
  });
});
