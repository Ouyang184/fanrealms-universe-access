# Full App Workflow Sweep

Goal: walk through every major flow end-to-end in the live preview, fix any breakage I find, and report back a clean bill of health (or list what was fixed).

## Scope of flows to verify

1. **Auth**
   - Signup (email) → profile completion → dashboard
   - Login (email) → dashboard (or → /complete-profile if incomplete)
   - Logout → /logout/loading → landing
   - Forgot password / reset password page loads
   - OAuth callback redirector
   - AuthGuard funnels: protected routes redirect to /login, auth pages redirect away when logged in
2. **Public browse**
   - Landing nav links (Marketplace, Games, Jobs, Forum)
   - Marketplace list + product detail
   - Jobs list + job detail
   - Forum list + thread detail
   - Games page
   - Search results
   - Seller profile (`/:username` catch-all)
3. **Dashboard (logged in)**
   - /dashboard, /dashboard/assets (+ new + detail), /dashboard/sales
   - /dashboard/projects (+ new + detail)
   - Sidebar links (Explore / Create / Account sections)
   - Become creator flow
4. **Settings & legal**
   - /settings tabs render
   - All legal/footer pages return 200 (Terms, Privacy, Cookies, Support, About, Payments, Security, Community/Creator Guidelines)
5. **Cleanup leftovers from recent /explore removal**
   - `src/App.tsx` still has `/explore` → `/marketplace` redirect routes (keep as safety net — confirm intentional)
   - `src/components/explore/ExploreCategories.tsx` still has a `console.log('Navigating to /explore/...')` — verify the actual nav target is `/marketplace?...` and remove the stale log
   - Confirm no broken imports remain (`@/components/explore/...` files should still exist where referenced — `ContentItem`, `PostPreviewModal`)

## Method

For each flow:
- Use the browser tool to navigate, click through, and screenshot key states
- Check console + network for errors
- For backend-heavy pages, also peek at edge function logs / `supabase--read_query` if data looks wrong
- Fix any bug inline (small, surgical edits — match existing style per project memory)

## Out of scope (won't touch unless broken)

- Stripe/payment live flows (won't run real checkouts; will only verify the UI mounts and the create-checkout-session call shape looks right)
- Sending real emails (Mailgun) — verify call shape only
- Visual polish / redesign work

## Deliverable

A short report listing: ✅ flows verified clean, 🔧 issues found and fixed (with file refs), ⚠️ issues found that need your decision before fixing.
