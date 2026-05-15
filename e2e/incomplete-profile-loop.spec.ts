import { test, expect } from '@playwright/test';
import {
  withAuthState,
  readNavLog,
  readListenerCount,
  readConsoleErrors,
  committedUrls,
} from './fixtures/mockSupabase';

/**
 * When a logged-in user with an incomplete profile visits a protected
 * dashboard route, the app must funnel them to /complete-profile exactly
 * once and stay there — no ping-pong between /complete-profile and the
 * dashboard, no redirect-budget warnings, and no duplicate auth listeners.
 */

const FORBIDDEN = /Redirect budget exceeded|Multiple GoTrueClient/i;

test.describe('incomplete profile redirect loop guard', () => {
  test.beforeEach(async ({ page }) => {
    await withAuthState(page, 'loggedInIncompleteProfile');
  });

  test('visiting /dashboard funnels to /complete-profile without looping', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/complete-profile\?returnTo=/);
    expect(new URL(page.url()).pathname).toBe('/complete-profile');

    // Give the router a generous beat to expose any loop.
    await page.waitForTimeout(1500);
    expect(new URL(page.url()).pathname).toBe('/complete-profile');

    const log = await readNavLog(page);
    const urls = committedUrls(log);

    // No consecutive duplicate commits.
    for (let i = 1; i < urls.length; i++) {
      expect(
        urls[i],
        `duplicate consecutive nav (full log: ${urls.join(' -> ')})`
      ).not.toBe(urls[i - 1]);
    }

    // Each side of the funnel may be hit at most a couple times during settle.
    const completeHits = urls.filter((u) => u.startsWith('/complete-profile')).length;
    const dashHits = urls.filter((u) => u === '/dashboard' || u.startsWith('/dashboard?')).length;
    expect(completeHits, `too many /complete-profile commits: ${urls.join(' -> ')}`).toBeLessThanOrEqual(3);
    expect(dashHits, `too many /dashboard commits: ${urls.join(' -> ')}`).toBeLessThanOrEqual(2);

    // Single auth listener, no forbidden console output.
    expect(await readListenerCount(page)).toBe(1);
    const errors = await readConsoleErrors(page);
    const bad = errors.filter((e) => FORBIDDEN.test(e));
    expect(bad, `forbidden console messages: ${bad.join(' | ')}`).toEqual([]);
  });

  test('deep dashboard route (/dashboard/assets) also funnels once and stops', async ({ page }) => {
    await page.goto('/dashboard/assets');
    await page.waitForURL(/\/complete-profile\?returnTo=/);
    expect(new URL(page.url()).pathname).toBe('/complete-profile');

    // returnTo must point back at the deep route so the user can resume.
    expect(decodeURIComponent(new URL(page.url()).search)).toContain('returnTo=/dashboard/assets');

    await page.waitForTimeout(1500);
    expect(new URL(page.url()).pathname).toBe('/complete-profile');

    const log = await readNavLog(page);
    const urls = committedUrls(log);
    for (let i = 1; i < urls.length; i++) {
      expect(urls[i]).not.toBe(urls[i - 1]);
    }

    const completeHits = urls.filter((u) => u.startsWith('/complete-profile')).length;
    const assetsHits = urls.filter((u) => u.startsWith('/dashboard/assets')).length;
    expect(completeHits).toBeLessThanOrEqual(3);
    expect(assetsHits).toBeLessThanOrEqual(2);

    expect(await readListenerCount(page)).toBe(1);
    const errors = await readConsoleErrors(page);
    const bad = errors.filter((e) => FORBIDDEN.test(e));
    expect(bad, `forbidden console messages: ${bad.join(' | ')}`).toEqual([]);
  });

  test('navigating from /complete-profile back to /dashboard re-funnels without looping', async ({ page }) => {
    await page.goto('/complete-profile');
    await page.waitForURL(/\/complete-profile/);

    await page.goto('/dashboard');
    await page.waitForURL(/\/complete-profile\?returnTo=/);

    await page.waitForTimeout(1500);
    expect(new URL(page.url()).pathname).toBe('/complete-profile');

    const log = await readNavLog(page);
    const urls = committedUrls(log);
    for (let i = 1; i < urls.length; i++) {
      expect(urls[i]).not.toBe(urls[i - 1]);
    }

    expect(await readListenerCount(page)).toBe(1);
    const errors = await readConsoleErrors(page);
    const bad = errors.filter((e) => FORBIDDEN.test(e));
    expect(bad).toEqual([]);
  });
});
