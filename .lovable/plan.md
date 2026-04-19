
The user wants the marketplace's edge-to-edge full-width layout AND its visual style applied to all main content pages.

### Visual style of marketplace (the "theme")
- `MainLayout fullWidth` — edge-to-edge container (no `max-w-7xl`)
- `bg-[#fafafa]` page background (already on MainLayout)
- White cards with `border-[#eee]` hairlines
- Tight typography: `text-[20px]` h1, `text-[13px] text-[#888]` subtext, `text-[12px]` pills
- Pills: `rounded-full`, white bg, `border-[#e5e5e5]`, primary fills active
- Itch.io-style density: `space-y-4`/`space-y-6`, compact paddings
- Empty states: small `w-12 h-12` icon tile, `text-[17px]` heading, primary CTA button

### Pages to update

**Listing pages (already partly aligned, just need `fullWidth`):**
- `Forum.tsx` — already uses `w-full` + matching pill style. Add `fullWidth` prop.
- `Jobs.tsx` — same, add `fullWidth`.
- `Games.tsx` — same, add `fullWidth`.
- `DashboardAssets.tsx` — already `w-full`. Add `fullWidth`.
- `DashboardSales.tsx` — same.
- `Dashboard.tsx` — same.
- `SellerProfile.tsx` — already `w-full`. Add `fullWidth`.

**Detail / sub-pages (need re-theming):**
- `ForumThread.tsx` — currently `max-w-3xl mx-auto`. Keep readable column for thread content (3xl is fine for prose) but pass `fullWidth` to MainLayout so the page bg/edges match, and restyle headings/back button to match marketplace tokens (`text-[#888]`, `text-[20px]`, hairline borders).
- `JobDetail.tsx` — same approach: keep `max-w-3xl` content column for readability, pass `fullWidth`, restyle title/badges/cards with marketplace tokens.
- `ProductDetail.tsx` — same.
- `SearchResults.tsx` — change `max-w-7xl` → `w-full`, add `fullWidth`, retheme.
- `Profile.tsx` — keep `max-w-3xl` content, pass `fullWidth`, retheme card.
- `About.tsx` — prose page, leave centered narrow column (don't force full-width on long-form text), but light retheme of headings/colors only. *Actually skip — long-form policy/about pages should stay readable.*

**Skip (intentionally):**
- `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `AuthCallback`, `Logout`, `LogoutLoading`, `Loading`, `NotFound` — auth/utility, no MainLayout
- `About`, `Terms`, `PrivacyPolicy`, `CookiePolicy`, `CommunityGuidelines`, `CreatorGuidelines`, `Support` — long-form prose, keep narrow centered for readability
- `Settings`, `AccountSettings`, `Security`, `Payments` — settings, keep current layout

### Approach
1. Add `fullWidth` to MainLayout calls on: Forum, Jobs, Games, Dashboard, DashboardAssets, DashboardSales, SellerProfile, ForumThread, JobDetail, ProductDetail, SearchResults, Profile.
2. For detail pages (ForumThread, JobDetail, ProductDetail, Profile): keep inner `max-w-3xl mx-auto` for readability of long content, but restyle headers/cards to use marketplace tokens (`text-[20px]` titles, `text-[13px] text-[#888]` meta, `border-[#eee]`, primary buttons with `bg-primary hover:bg-[#3a7aab]`).
3. For SearchResults: switch to `w-full` and retheme.

### Files to change
- `src/pages/Forum.tsx`, `src/pages/Jobs.tsx`, `src/pages/Games.tsx` — add `fullWidth`
- `src/pages/Dashboard.tsx`, `src/pages/DashboardAssets.tsx`, `src/pages/DashboardSales.tsx` — add `fullWidth`
- `src/pages/SellerProfile.tsx` — add `fullWidth`
- `src/pages/ForumThread.tsx` — add `fullWidth`, retheme header/cards
- `src/pages/JobDetail.tsx` — add `fullWidth`, retheme header/cards
- `src/pages/ProductDetail.tsx` — add `fullWidth`, retheme
- `src/pages/SearchResults.tsx` — add `fullWidth`, switch container, retheme
- `src/pages/Profile.tsx` — add `fullWidth`, light retheme

### Out of scope
- Auth pages (Login/Signup/etc.)
- Long-form prose pages (About, Terms, Privacy, etc.) — readability comes first
- Settings family
- Restructuring page content or adding new sections
