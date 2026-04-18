# New Pages — itch.io Model Design

**Date:** 2026-04-18
**Status:** Approved

## Goal

Replace all Patreon-style pages with a clean itch.io-style structure. One account type — every user can buy and sell. Public profile at `/:username` is the seller's shop. Private dashboard at `/dashboard` for purchases and asset management. No subscriptions, no tiers, no creator mode.

## Scope

### Pages being deleted

Remove from `src/pages/` and `src/App.tsx`:

- `Feed.tsx`
- `Following.tsx` + `following/` directory
- `Subscriptions.tsx`
- `MembershipTiers.tsx`
- `Creator.tsx`
- `Explore.tsx`
- `ExploreAll.tsx`
- `ExploreCategory.tsx`
- `AllCreators.tsx`
- `AllCreatorsExplore.tsx`
- `AllFeaturedCreators.tsx`
- `AllPosts.tsx`
- `AllCommissions.tsx`
- `ShareablePost.tsx`
- `Onboarding.tsx`
- `Community.tsx`
- `Preferences.tsx`
- `CompleteProfile.tsx`
- `Messages.tsx`
- `Requests.tsx`
- `CommissionPayment.tsx`
- `CommissionPaymentSuccess.tsx`
- `Payment.tsx`
- `PaymentMethods.tsx`
- `Purchases.tsx`
- `creator-studio/` (entire directory)
- `Index.tsx` (superseded by Landing)

Remove all corresponding `<Route>` entries from `src/App.tsx`. Remove unused imports.

### Pages being kept (untouched)

Landing, Marketplace, ProductDetail, Jobs, JobDetail, Forum, ForumThread, Games, Login, Signup, ForgotPassword, ResetPassword, AuthCallback, Logout, LogoutLoading, NotFound, Loading, About, Terms, PrivacyPolicy, CookiePolicy, Support, Security, Payments, CommunityGuidelines, CreatorGuidelines, AccountSettings, Settings, SearchResults, Profile (will be replaced by `/:username`).

---

## New Pages

### 1. `/:username` — Seller Shop Page (public)

**Route:** `/:username` (catch-all, after all named routes)
**File:** `src/pages/SellerProfile.tsx`
**Auth:** Public — no login required to view

**Layout:** `MainLayout`

**Sections:**

**Header**
- Avatar (from `profiles.avatar_url`, fallback initials on `bg-[#111]`)
- Display name + `@username`
- Short bio (`profiles.bio`)
- Join date: "Joined April 2026"
- Stats row: `X assets · X sales`
- Follow button (logged-in users only, wired to a `follows` table)

**Asset grid**
- Same 4-column grid + card style as Marketplace
- Filtered to `marketplace_products` where `creator_id = profile.id` and `status = 'published'`
- Empty state: "No assets listed yet."
- Infinite scroll or simple pagination (load more button)

**No tiers, no subscriptions, no posts.**

---

### 2. `/dashboard` — Logged-in Home

**Route:** `/dashboard`
**File:** `src/pages/Dashboard.tsx` (replaces old `src/pages/Dashboard.tsx` if it exists — check first)
**Auth:** Required (`<AuthGuard>`)

**Layout:** `MainLayout`

**Sections:**

**Purchases panel** (always shown)
- Lists assets the user has bought: title, seller username, "Download" button
- Download button reveals the `download_url` (fetched from `purchases` join on `marketplace_products`)
- Empty state: "You haven't bought anything yet. [Browse marketplace →]"

**Seller stats panel** (shown only if user has at least 1 published asset)
- Cards: Total revenue (net after 10% fee), Assets listed, Total sales
- Link to `/dashboard/assets` and `/dashboard/sales`

**Upload CTA** (shown only if user has 0 published assets)
- "Ready to sell your Godot assets? [Upload your first asset →]"

---

### 3. `/dashboard/assets` — Manage Listings

**Route:** `/dashboard/assets`
**File:** `src/pages/DashboardAssets.tsx`
**Auth:** Required (`<AuthGuard>`)

**Layout:** `MainLayout`

**Sections:**

**Header row**
- Title: "Your Assets"
- "New asset" button → opens `NewAssetModal` (or navigates to `/dashboard/assets/new`)

**Assets table**
Columns: Cover thumbnail · Title · Category · Price · Sales · Status (Published / Draft) · Actions (Edit, Delete)
- Empty state: "No assets yet. Upload your first Godot asset."

**New / Edit asset form** (modal or dedicated route `/dashboard/assets/new` and `/dashboard/assets/:id/edit`)

Fields:
| Field | Type | Notes |
|-------|------|-------|
| Title | text input | required |
| Description | textarea | required |
| Category | select | plugins, shaders, sprites, audio, games, tools |
| Tags | tag input | comma-separated, stored as `text[]` |
| Price | number input | in dollars, stored as cents. $0 = free |
| Cover image | file upload | → Supabase Storage, `marketplace_products.cover_image_url` |
| Screenshots | multi file upload | → Supabase Storage, up to 5 |
| Download URL | text input | External link (MEGA, Google Drive, Dropbox, direct URL). Stored in `marketplace_products.download_url`. **Never shown to non-buyers.** |
| Status | toggle | Published / Draft |

**Validation:** Download URL must be a valid URL. Cover image required to publish.

---

### 4. `/dashboard/sales` — Revenue & Payouts

**Route:** `/dashboard/sales`
**File:** `src/pages/DashboardSales.tsx`
**Auth:** Required (`<AuthGuard>`)

**Layout:** `MainLayout`

**Sections:**

**Stats row**
- Total earned (gross), Platform fees (10%), Net payout, Pending payout

**Sales table**
Columns: Asset · Date · Gross · Fee · Net
- Buyer shown as anonymous (no PII exposed)
- Empty state: "No sales yet."

**Payout section**
- Stripe Connect onboarding status (connected / not connected)
- "Set up payouts" CTA if not connected → Stripe Connect onboarding URL

---

## Storage Model

| Data | Where stored |
|------|-------------|
| Asset metadata (title, desc, price, category, tags) | Supabase `marketplace_products` table |
| Cover image + screenshots | Supabase Storage (`product-images` bucket) |
| Download URL | `marketplace_products.download_url` column — SELECT restricted by RLS: only readable by the buyer (via `purchases` table) or the seller |
| Purchases | Supabase `purchases` table — created by Stripe webhook on `checkout.session.completed` |

**RLS rule for `download_url`:** A user can read `download_url` only if they appear in `purchases` for that product, OR if they are the `creator_id` of that product.

---

## Routing Summary

```
/                        Landing (public)
/marketplace             Marketplace browse (public)
/marketplace/:id         Product detail (public)
/games                   Games (public)
/jobs                    Jobs (public)
/jobs/:id                Job detail (public)
/forum                   Forum (public)
/forum/:id               Forum thread (public)
/login                   Login
/signup                  Signup
/dashboard               Logged-in home (auth)
/dashboard/assets        Manage listings (auth)
/dashboard/assets/new    Upload new asset (auth)
/dashboard/assets/:id/edit  Edit asset (auth)
/dashboard/sales         Revenue & payouts (auth)
/:username               Seller shop (public, catch-all)
```

---

## Out of Scope

- Real-time notifications
- Direct messaging
- Commission system
- Stripe Connect payout implementation (frontend shell only — actual payouts need backend webhook work handled separately)
- User search
- Asset reviews/ratings
