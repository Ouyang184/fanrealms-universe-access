# E2E tests

Playwright tests for auth navigation. Verifies no duplicate redirects and that
`supabase.auth.onAuthStateChange` is registered exactly once across navigation.

## Setup (once)

```bash
npm run test:e2e:install
```

## Run

```bash
npm run test:e2e
```

The Playwright config spawns `npm run dev` automatically on port 8080 (or
reuses an already-running dev server).

These tests do NOT hit real Supabase — `e2e/fixtures/mockSupabase.ts` stubs
both `localStorage` and `fetch` before any app code runs.
