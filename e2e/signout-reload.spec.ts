import { test, expect } from '@playwright/test';
import { withAuthState, readConsoleErrors } from './fixtures/mockSupabase';

/**
 * After signing out and reloading the browser, the user must land on /login
 * with no Supabase session restored from storage.
 */

const ERROR_TEXT_PATTERN =
  /invalid (login|credentials)|incorrect|failed|error|something went wrong/i;

async function signOut(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const client = (globalThis as any).__fanrealms_supabase_client__;
    if (client?.auth?.signOut) {
      await client.auth.signOut();
    }
    // Belt-and-suspenders: scrub any leftover auth keys, mirroring the
    // app's purgeSupabaseAuthStorage() fallback.
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k === 'fanrealms-auth' ||
          k.startsWith('sb-') ||
          k.startsWith('supabase.auth.')
        ) {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  });
}

test.describe('signed-out reload', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');
  });

  test('signing out then reloading redirects to /login with no session', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard$/);

    // Sanity: session is live before sign-out.
    const hasSessionBefore = await page.evaluate(async () => {
      const client = (globalThis as any).__fanrealms_supabase_client__;
      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    });
    expect(hasSessionBefore).toBe(true);

    await signOut(page);

    // Storage must be clear after sign-out.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('fanrealms-auth')
    );
    expect(stored).toBeNull();

    // Full browser reload — must NOT restore the session.
    await page.reload();

    await page.waitForURL(/\/login(\?|$)/);
    expect(new URL(page.url()).pathname).toBe('/login');

    // No session in singleton client after reload.
    const hasSessionAfter = await page.evaluate(async () => {
      const client = (globalThis as any).__fanrealms_supabase_client__;
      if (!client?.auth?.getSession) return false;
      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    });
    expect(hasSessionAfter).toBe(false);

    // No spurious auth errors in console.
    const errors = await readConsoleErrors(page);
    const authErrors = errors.filter((e) => ERROR_TEXT_PATTERN.test(e));
    expect(authErrors, `console auth errors: ${authErrors.join(' | ')}`).toEqual([]);
  });

  test('signing out from a deep route then reloading still lands on /login', async ({ page }) => {
    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/dashboard\/assets$/);

    await signOut(page);
    await page.reload();

    await page.waitForURL(/\/login(\?|$)/);
    expect(new URL(page.url()).pathname).toBe('/login');

    const hasSession = await page.evaluate(async () => {
      const client = (globalThis as any).__fanrealms_supabase_client__;
      if (!client?.auth?.getSession) return false;
      const { data } = await client.auth.getSession();
      return !!data?.session?.access_token;
    });
    expect(hasSession).toBe(false);
  });
});
