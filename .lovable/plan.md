# Why the Jobs page feels slow

I profiled the running preview. The Jobs route itself is fine — the `useJobListings` query hits Supabase once and returns quickly. The slowness is **not** caused by the Jobs page code or by a slow DB query.

What's actually happening:

- **First Contentful Paint: ~11.6s**
- **250 script requests** on first load, totaling ~2 MB
- The largest single script is `DashboardAssetDetail.tsx` (39 KB, 1.6s) — a page that has nothing to do with `/jobs`

## Root cause

`src/App.tsx` eagerly imports **every** page in the app at the top of the file (56 imports — Landing, Login, Dashboard, all Dashboard sub-pages, Marketplace, ProductDetail, Forum, Games, Subscriptions, Payment pages, etc.). So when a user opens `/jobs` cold, Vite has to fetch and parse the JS for *every* route in the app before the Jobs page can render. In dev that means 250 individual module requests; in production it means one big bundle that includes pages the user will never visit on this navigation.

## Plan

Convert the per-page imports in `src/App.tsx` to `React.lazy(...)` and wrap `<Routes>` in a `<Suspense fallback={<LoadingPage />}>`. Keep eager imports only for the small set of things needed on every render:

- `LandingPage`, `Login`, `Signup`, `NotFound`, `LoadingPage` (used as Suspense fallback)
- Layout / provider components (`RootLayout`, `MainLayout`, `AuthProvider`, `AuthGuard`, `AuthGate`, `Toaster`, `TooltipProvider`, `QueryClientProvider`)

Everything else — Dashboard pages, Marketplace, ProductDetail, Jobs, JobDetail, Forum, Games, Library pages, Devlogs, Jam, Payments, Subscriptions, Settings pages, legal pages — becomes:

```ts
const Jobs = lazy(() => import("./pages/Jobs"));
```

### Expected impact

- `/jobs` cold load drops from ~250 scripts to only the modules it actually needs (Jobs + MainLayout + shared deps)
- FCP should drop from ~11s to ~2–3s in dev, with a similar proportional win in production
- Other heavy pages (Dashboard, ProductDetail) get the same benefit
- No behavior or UI change — only how chunks are loaded

### Out of scope

- No changes to `useJobs.ts`, the Jobs UI, or the DB query
- No design changes
- No new dependencies

### Files touched

- `src/App.tsx` (only)
