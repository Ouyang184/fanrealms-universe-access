## Other incomplete end-to-end flows (besides Notifications & Commissions)

After auditing the codebase, here are the flows where infrastructure exists but the end-to-end experience is broken or never wired up.

### 1. Jobs — applying & managing applicants (most broken)
- `job_applications` table exists with RLS for applicants and posters.
- Hooks `useApplyToJob`, `useJobApplications`, `useUpdateApplicationStatus` exist in `src/hooks/useJobs.ts`.
- `src/components/jobs/JobApplicationDialog.tsx` exists but is **never imported anywhere**.
- `src/pages/JobDetail.tsx` only shows the poster's contact info — no "Apply" button.
- Posters have no UI to view applicants or update status (accept/reject).

Result: the entire application workflow is dead code. Jobs is currently a "post a contact email" board.

### 2. Bundles — purchase flow
- `bundles` and `bundle_purchases` tables exist with RLS, plus `bundle_items` join table.
- `useSalesBundles` hooks and dashboard UI let creators create/list bundles in `DashboardSales`.
- But: no public bundle detail page, no "Buy bundle" button, no checkout edge function for bundles, no webhook handler inserting into `bundle_purchases`.

Result: creators can build bundles that nobody can actually buy.

### 3. Direct messages / inbox
- `conversations`, `conversation_participants`, `messages` tables exist.
- Hooks: `useMessages`, `useConversations`, `useDeleteMessage`.
- But: **no `/messages` or `/inbox` page** anywhere in `src/pages`, no nav entry, no message composer.

Result: messaging backend is fully unreachable from the UI.

### 4. Marketplace refunds / disputes
- `manual-refund-commission` edge function handles commission refunds only.
- Marketplace purchases have no in-app refund or dispute flow — `Payments.tsx` punts to `disputes@fanrealms.com`.
- No "request refund" button on `Library` items, no admin/creator-side refund UI.

Result: every marketplace dispute is manual email work outside the app.

### 5. Library → Recommendations (cosmetic)
- `src/pages/LibraryRecommendations.tsx` just returns the first 12 marketplace products from `useMarketplaceProducts`. No personalisation, no ranking, no signal from purchases/follows.

Result: tab works but the name is misleading; it's just "latest products".

### What's actually solid end-to-end
For reference, these flows are wired through: marketplace browse → checkout → download, subscriptions, follows + follower counts, forum threads/replies/view counts, jams (submit + vote), devlogs (CRUD), creator Stripe Connect + earnings, auth + profile completion.

---

### Suggested order of attack (when you switch to build mode)
1. **Jobs application flow** — biggest user-facing gap, hooks already exist; just needs to wire `JobApplicationDialog` into `JobDetail` and add a posters' "Applicants" view.
2. **Messages page** — backend is ready; needs `/messages` page + entry points from creator/profile pages.
3. **Bundles purchase** — needs a new `create-bundle-checkout` edge function, a public bundle page, and webhook updates.
4. **Marketplace refunds** — needs an edge function (analogous to `manual-refund-commission`) and minimal UI in Library + dashboard.
5. **Real Library recommendations** — lower priority, more of a polish/algorithm task.

Tell me which of these you want me to tackle (or pick a different priority) and I'll start.