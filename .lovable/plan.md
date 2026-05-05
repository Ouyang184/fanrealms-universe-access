## Remove "Become a Creator" banner from Dashboard

Every signed-up user with a completed profile is already a creator on FanRealms (matching itch.io's model), so the upsell banner is unnecessary friction.

### Change

**`src/pages/Dashboard.tsx`**
- Remove the conditional `Become a Creator` banner block (the `!creatorLoading && !isCreator && (...)` card with the `Sparkles` icon and "Get started" link to `/become-creator`).
- Remove now-unused imports: `useCreatorProfile`, `Sparkles`, `Button` (verify each is unused after removal — keep if still referenced elsewhere in the file).
- Remove the `isCreator` / `creatorLoading` destructure.

### Out of scope (not touched in this pass)

- The `/become-creator` route and `BecomeCreator.tsx` page itself — leaving in place in case it's still linked from settings or other flows. Can be removed in a follow-up if you confirm.
- Sidebar `Create` section in `DashboardLayout` (already gated on `isCreator`) — leaving as-is for now; tell me if you want it always-visible too.
