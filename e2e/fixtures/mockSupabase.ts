import type { Page } from '@playwright/test';

export type AuthState =
  | 'loggedOut'
  | 'loggedInIncompleteProfile'
  | 'loggedInCompleteProfile';

declare global {
  interface Window {
    __navLog: Array<{ method: string; url: string }>;
    __authListenerCount: number;
    __consoleErrors: string[];
  }
}

/**
 * Installs init scripts that:
 *  - Seed/clear the supabase-js v2 session under the `fanrealms-auth` storage key
 *  - Stub fetch for any *.supabase.co/auth/v1/* and /rest/v1/users|creators* call
 *  - Wrap history.pushState/replaceState to log every navigation
 *  - Patch the singleton Supabase client's `auth.onAuthStateChange` to count
 *    listener registrations
 *
 * Must be called BEFORE page.goto().
 */
export async function withAuthState(page: Page, state: AuthState) {
  await page.addInitScript((stateArg: AuthState) => {
    const FAR_FUTURE = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
    const USER_ID = '00000000-0000-0000-0000-000000000001';
    const EMAIL = 'e2e@example.com';

    const fakeUser = {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: EMAIL,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fakeSession = {
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: FAR_FUTURE,
      user: fakeUser,
    };

    // ---------- Seed localStorage ----------
    if (stateArg !== 'loggedOut') {
      try {
        window.localStorage.setItem(
          'fanrealms-auth',
          JSON.stringify({ currentSession: fakeSession, expiresAt: FAR_FUTURE })
        );
      } catch {
        /* ignore */
      }
    } else {
      try {
        window.localStorage.removeItem('fanrealms-auth');
      } catch {
        /* ignore */
      }
    }

    // ---------- Instrumentation ----------
    window.__navLog = [];
    window.__authListenerCount = 0;
    window.__consoleErrors = [];

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args: any[]) {
      try {
        window.__navLog.push({ method: 'push', url: location.pathname + location.search });
      } catch {
        /* ignore */
      }
      const r = origPush.apply(this, args as any);
      try {
        window.__navLog.push({ method: 'push:after', url: location.pathname + location.search });
      } catch {
        /* ignore */
      }
      return r;
    } as typeof history.pushState;
    history.replaceState = function (...args: any[]) {
      const r = origReplace.apply(this, args as any);
      try {
        window.__navLog.push({ method: 'replace', url: location.pathname + location.search });
      } catch {
        /* ignore */
      }
      return r;
    } as typeof history.replaceState;

    // ---------- Console capture ----------
    const origErr = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    console.error = (...args: unknown[]) => {
      try {
        window.__consoleErrors.push(args.map(String).join(' '));
      } catch {
        /* ignore */
      }
      origErr(...args);
    };
    console.warn = (...args: unknown[]) => {
      try {
        window.__consoleErrors.push(args.map(String).join(' '));
      } catch {
        /* ignore */
      }
      origWarn(...args);
    };

    // ---------- Fetch stub ----------
    const origFetch = window.fetch.bind(window);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      });

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);

      if (/\/auth\/v1\/token\b/.test(url)) {
        if (stateArg === 'loggedOut') return json({ error: 'invalid' }, 400);
        return json(fakeSession);
      }
      if (/\/auth\/v1\/user\b/.test(url)) {
        if (stateArg === 'loggedOut') return json({ msg: 'no user' }, 401);
        return json(fakeUser);
      }
      if (/\/auth\/v1\/logout\b/.test(url)) {
        return new Response(null, { status: 204 });
      }
      if (/\/rest\/v1\/users\b/.test(url)) {
        if (stateArg === 'loggedOut') return json([]);
        const display_name =
          stateArg === 'loggedInCompleteProfile' ? 'E2E User' : null;
        return json([
          {
            id: USER_ID,
            email: EMAIL,
            username: 'e2euser',
            profile_picture: null,
            website: null,
            created_at: new Date().toISOString(),
            display_name,
          },
        ]);
      }
      if (/\/rest\/v1\/creators\b/.test(url)) {
        return json([]);
      }
      if (/\/rest\/v1\/rpc\//.test(url)) {
        return json(null);
      }
      // Other Supabase REST: return empty array to avoid network noise.
      if (/\.supabase\.co\/rest\/v1\//.test(url)) {
        return json([]);
      }
      return origFetch(input as any, init);
    };

    // ---------- Patch the singleton Supabase client's auth.onAuthStateChange ----------
    const SINGLETON_KEY = '__fanrealms_supabase_client__';
    let patched = false;
    const tryPatch = () => {
      if (patched) return true;
      const client = (globalThis as any)[SINGLETON_KEY];
      if (!client?.auth?.onAuthStateChange) return false;
      const orig = client.auth.onAuthStateChange.bind(client.auth);
      client.auth.onAuthStateChange = (cb: any) => {
        window.__authListenerCount += 1;
        return orig(cb);
      };
      patched = true;
      return true;
    };
    const interval = setInterval(() => {
      if (tryPatch()) clearInterval(interval);
    }, 10);
    setTimeout(() => clearInterval(interval), 10_000);
  }, state);
}

export async function readNavLog(page: Page) {
  return page.evaluate(() => window.__navLog ?? []);
}

export async function readListenerCount(page: Page) {
  return page.evaluate(() => window.__authListenerCount ?? 0);
}

export async function readConsoleErrors(page: Page) {
  return page.evaluate(() => window.__consoleErrors ?? []);
}

/** Returns urls actually committed to history (post-navigation), in order. */
export function committedUrls(log: Array<{ method: string; url: string }>) {
  return log
    .filter((e) => e.method === 'replace' || e.method === 'push:after')
    .map((e) => e.url);
}
