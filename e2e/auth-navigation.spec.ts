import { test, expect } from '@playwright/test';
import {
  withAuthState,
  readNavLog,
  readListenerCount,
  readConsoleErrors,
  committedUrls,
} from './fixtures/mockSupabase';

const FORBIDDEN = /Redirect budget exceeded|Multiple GoTrueClient/i;

function assertNoDuplicateRedirects(urls: string[]) {
  for (let i = 1; i < urls.length; i++) {
    expect(
      urls[i],
      `duplicate consecutive nav to ${urls[i]} (full log: ${urls.join(' -> ')})`
    ).not.toBe(urls[i - 1]);
  }
}

async function assertHealth(page: import('@playwright/test').Page) {
  const count = await readListenerCount(page);
  expect(count, 'onAuthStateChange listener count').toBe(1);
  const errors = await readConsoleErrors(page);
  const bad = errors.filter((e) => FORBIDDEN.test(e));
  expect(bad, `forbidden console messages: ${bad.join(' | ')}`).toEqual([]);
}

test.describe('auth navigation', () => {
  test('logged-out: protected routes bounce to /login without redirect loops', async ({ page }) => {
    await withAuthState(page, 'loggedOut');

    await page.goto('/dashboard');
    await page.waitForURL(/\/login\?returnTo=%2Fdashboard/);
    expect(new URL(page.url()).pathname).toBe('/login');

    await page.goto('/signup');
    await page.waitForURL(/\/signup$/);

    await page.goto('/login');
    await page.waitForURL(/\/login(\?|$)/);

    await page.goto('/complete-profile');
    await page.waitForURL(/\/login\?returnTo=%2Fcomplete-profile/);

    const log = await readNavLog(page);
    assertNoDuplicateRedirects(committedUrls(log));
    await assertHealth(page);
  });

  test('logged-in incomplete profile: routes funnel into /complete-profile', async ({ page }) => {
    await withAuthState(page, 'loggedInIncompleteProfile');

    await page.goto('/dashboard');
    await page.waitForURL(/\/complete-profile\?returnTo=/);

    await page.goto('/login');
    // /login bounces authed users → /dashboard → AuthGuard funnels to /complete-profile.
    await page.waitForURL(/\/complete-profile/);

    const log = await readNavLog(page);
    assertNoDuplicateRedirects(committedUrls(log));
    await assertHealth(page);
  });

  test('logged-in complete profile: auth pages redirect to /dashboard, no loops', async ({ page }) => {
    await withAuthState(page, 'loggedInCompleteProfile');

    await page.goto('/login');
    await page.waitForURL(/\/dashboard$/);

    await page.goto('/signup');
    await page.waitForURL(/\/dashboard$/);

    await page.goto('/complete-profile');
    // requireCompleteProfile={false} on /complete-profile — should stay there.
    await page.waitForURL(/\/complete-profile$/);

    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard$/);

    const log = await readNavLog(page);
    const urls = committedUrls(log);
    assertNoDuplicateRedirects(urls);

    // No more than 2 distinct settle-on-dashboard events (one per explicit goto here).
    const dashHits = urls.filter((u) => u === '/dashboard').length;
    expect(dashHits, `dashboard committed too many times: ${urls.join(' -> ')}`).toBeLessThanOrEqual(3);

    await assertHealth(page);
  });
});
