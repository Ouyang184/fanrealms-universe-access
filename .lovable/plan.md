# Auth navigation E2E test (Playwright + mocked Supabase)

Add a Playwright suite that drives the running Vite dev server, mocks Supabase auth in the browser, navigates between the four auth-related routes, and asserts no auth listener is registered twice and no redirect loops occur.

## What gets added

1. **Dev dependencies** (devDependencies in `package.json`):
   - `@playwright/test`
2. **`playwright.config.ts`** at project root:
   - `testDir: './e2e'`
   - `webServer: { command: 'npm run dev', url: 'http://localhost:8080', reuseExistingServer: true }` (port comes from `vite.config.ts`)
   - One project: `chromium`, `baseURL: 'http://localhost:8080'`
   - `use: { trace: 'retain-on-failure' }`
3. **`package.json` scripts**:
   - `"test:e2e": "playwright test"`
   - `"test:e2e:install": "playwright install --with-deps chromium"`
4. **`e2e/fixtures/mockSupabase.ts`** — exposes a Playwright fixture `withAuthState(page, state)` where `state` is one of:
   - `loggedOut`
   - `loggedInIncompleteProfile`
   - `loggedInCompleteProfile`

   It uses `page.addInitScript` to install instrumentation **before any app code runs**:
   - Replace `window.localStorage.getItem('fanrealms-auth')` to return a fake session (or null) matching `state`.
   - Patch `fetch` so any request to `*.supabase.co/auth/v1/*` and `/rest/v1/users|creators*` returns canned JSON matching `state` (no real network).
   - Wrap `history.pushState` / `history.replaceState` and record every `(method, url)` into `window.__navLog`.
   - After the Supabase client is created, patch `supabase.auth.onAuthStateChange` via a `Proxy` on `globalThis.__fanrealms_supabase_client__` (the singleton key already added in `client.ts`) to increment `window.__authListenerCount` on each call. A `MutationObserver`/microtask waits until the singleton exists, then patches it once.
   - Listen for `console` messages and push errors/warnings into `window.__consoleErrors`.
5. **`e2e/auth-navigation.spec.ts`** — three tests:

   **Test A — Logged-out flow**
   - Apply `loggedOut` fixture.
   - Visit `/dashboard` → expect final URL `/login?returnTo=%2Fdashboard`.
   - Click link to `/signup`, then back to `/login`, then visit `/complete-profile` → expect bounce to `/login?returnTo=%2Fcomplete-profile`.
   - Assertions:
     - `window.__authListenerCount === 1`
     - No two consecutive entries in `window.__navLog` target the same URL (no double redirect).
     - `window.__consoleErrors` contains no entry matching `/Redirect budget exceeded|Multiple GoTrueClient/`.

   **Test B — Logged-in, incomplete profile**
   - Apply `loggedInIncompleteProfile`.
   - Visit `/dashboard` → expect redirect to `/complete-profile?returnTo=%2Fdashboard`.
   - Visit `/login` → expect redirect to `/dashboard` (auth page bounce) → which then bounces to `/complete-profile`. Assert the **final** URL is `/complete-profile?...` and that `__navLog` shows that target appearing only once consecutively.
   - Same listener-count + console-error assertions.

   **Test C — Logged-in, complete profile**
   - Apply `loggedInCompleteProfile`.
   - Visit `/login` → expect `/dashboard`.
   - Visit `/signup` → expect `/dashboard`.
   - Visit `/complete-profile` → page renders (AuthGuard with `requireCompleteProfile={false}` allows it; assert no redirect away).
   - Visit `/dashboard` → stays on `/dashboard`.
   - Same listener-count + console-error assertions.
   - Additional assertion: `window.__navLog.filter(e => e.url.endsWith('/dashboard')).length <= 2` to catch repeat pushes.

6. **`e2e/README.md`** — short note: run `npm run test:e2e:install` once, then `npm run test:e2e`. Tests assume dev server on `:8080` (Playwright spawns it automatically).

## Why this works

- The app already enforces a single Supabase client via the `__fanrealms_supabase_client__` global singleton, so the test can reach in and wrap `onAuthStateChange` deterministically.
- `AuthContext` registers exactly one listener at provider mount. Any regression that re-registers per route or per HMR will push `__authListenerCount` above 1 and fail Test A/B/C immediately.
- `AuthGuard` logs `[AuthGuard] Redirect budget exceeded` when its loop guard trips; capturing console output catches loops even if the final URL happens to settle.

## Technical details

- Vite dev server port is `8080` (per `vite.config.ts`); confirm and reuse in `playwright.config.ts`.
- Mock session shape stored under `localStorage['fanrealms-auth']` matches what `@supabase/supabase-js` v2 persists: `{ currentSession: { access_token, refresh_token, expires_at, user: {...} }, expiresAt }`. Use a far-future `expires_at` to skip refresh.
- Fetch interception covers:
  - `POST /auth/v1/token?grant_type=refresh_token` → 200 with same fake session (defensive; should not be hit).
  - `GET /auth/v1/user` → 200 with fake user or 401 for logged-out.
  - `GET /rest/v1/users?...` → row with `display_name` populated for `complete`, empty for `incomplete`.
  - `GET /rest/v1/creators?...` → empty array.
- `__navLog` records both `pushState` and `replaceState`; we treat consecutive entries with identical pathname+search as a duplicate redirect.
- The `[AUTH][Context]` console.log lines from `AuthContext` are not errors; only `console.error` and `console.warn` feed `__consoleErrors`, filtered by the regex above.
- No source files in `src/` are modified — only new files under `e2e/`, plus `playwright.config.ts` and `package.json` script/devDep additions.

## Out of scope

- Wiring this into Lovable's auto-test harness (Lovable runs Vitest, not Playwright). User runs `npm run test:e2e` manually or in their own CI.
- Real Supabase auth, Turnstile, OAuth — all stubbed.
