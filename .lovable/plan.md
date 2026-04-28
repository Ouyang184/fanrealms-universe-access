## Problem

The two existing forum threads (the Game Jam and Asset Competition posts) are stored under the **Showcase** category. The Forum page opens on the **General** tab by default and shows no indicator that other categories have content, so the threads appear "missing".

## Fix

Update `src/pages/Forum.tsx` so users can see all threads immediately and can tell which categories have activity.

1. **Add an "All" tab** as the first segmented option, set as the default selection. When active, `useForumThreads` is called without a category filter so every published thread is listed.

2. **Show per-category counts** in the segmented bar. Fetch thread counts grouped by category once (lightweight query) and render a small number next to each label, so users can see Showcase has 2 threads even when they're on another tab.

3. **Empty-state hint**: when a specific category has 0 threads but other categories do, add a one-line link like "2 threads in Showcase" that switches the tab, so content is always one click away.

No database, RLS, or backend changes needed — the threads are already published and visible. This is purely a frontend discoverability fix in `src/pages/Forum.tsx` (and a small addition to `src/hooks/useForum.ts` for the counts query).

## Technical notes

- New hook `useForumThreadCounts()` in `src/hooks/useForum.ts`: selects `category` from `forum_threads` where `status = 'published'`, reduces to `{ [category]: count }` client-side. Cached with React Query.
- `ALL_CATEGORIES` becomes `['All', ...FORUM_CATEGORIES]`; passing `'All'` (or `undefined`) to `useForumThreads` skips the `.eq('category', ...)` filter (already supported via the `'all'` branch — rename to match).
- Keep the existing Clean & Minimal styling, no emojis in UI copy.
