## Goal

Restructure the navigation and dashboard to match itch.io's mental model: **Library** = what you bought (buyer side), **Dashboard** = what you sell (creator side). Remove the redundant Projects tab, add project-attached Devlogs (posts), and build a real Sales & Bundles feature.

## 1. Sidebar restructure (`src/components/Layout/Sidebar/MainNavigation.tsx`)

Three new sections instead of "Browse / Sell":

```text
EXPLORE
  Marketplace          /marketplace
  My Library           /library
  Recommendations      /library/recommendations

CREATE
  Dashboard            /dashboard
  Upload new project   /dashboard/upload   (replaces Projects)
  Devlogs              /dashboard/devlogs  (new — posts tied to a project)
  Assets               /dashboard/assets
  Sales & bundles      /dashboard/sales

ACCOUNT
  View profile         /:username (own)
  Settings             /settings
  Log out              /logout
```

Active-state highlighting and section labels stay consistent with the current design.

## 2. Library (buyer side) — new pages

- **`/library`** (`src/pages/Library.tsx`) — "Things you own": grid of purchased projects/assets with Download buttons. Sub-nav at top: My Library · Ratings & Reviews · Recommendations.
- **`/library/reviews`** (`src/pages/LibraryReviews.tsx`) — reviews the user has written, plus a "Things to Rate" list (purchases without a rating).
- **`/library/recommendations`** (`src/pages/LibraryRecommendations.tsx`) — simple recommendations list (initial implementation: top-selling projects in categories the user has bought from).

Reuses existing `useUserPurchases` hook. New small hook `useUserReviews` reads from `creator_ratings` / `game_ratings` for the current user.

## 3. Dashboard cleanup

- **Remove the Projects tab** from sidebar. Keep `/dashboard/projects/*` routes alive but unlinked (so existing edit URLs keep working). The Dashboard page will show the project list inline (table with Edit links).
- **`/dashboard`** — refocus on creator overview only (no purchases section). Sections: stats row, recent sales, your projects (table with edit links), Upload CTA. Drop the buyer "Purchases" panel — that's now in Library.
- **`/dashboard/upload`** — alias route to `DashboardProjectNew` (clearer label). Old `/dashboard/projects/new` keeps redirecting here.

## 4. Devlogs (new posts feature)

The `devlogs` table already exists with fields `project_id`, `author_id`, `title`, `content`, `tags`, `status`. Build the UI:

- **`/dashboard/devlogs`** (`src/pages/DashboardDevlogs.tsx`) — list of all devlogs the user has written, grouped or filterable by project. "New devlog" button.
- **`/dashboard/devlogs/new`** + **`/dashboard/devlogs/:id/edit`** — form: select a project (dropdown of user's projects), title, markdown content, tags, publish/draft toggle.
- Public display: devlogs already render on the project detail page per the spec; verify and wire up if missing.

New hook: `src/hooks/useDevlogs.ts` (CRUD against `devlogs` table; RLS already in place).

## 5. Sales & Bundles (full implementation)

### Database (new migration)

Two new tables:

**`sales`** — discount period for one or more projects
- `creator_id`, `name`, `discount_percent` (1-90), `starts_at`, `ends_at`, `status` (`scheduled`/`active`/`ended`), `created_at`

**`sale_items`** — junction: which projects are in a sale
- `sale_id`, `project_id` (or `digital_product_id`), unique together

**`bundles`** — group of projects sold together at a single price
- `creator_id`, `title`, `description`, `bundle_price` (cents), `cover_image_url`, `status` (`draft`/`published`), `created_at`

**`bundle_items`** — junction
- `bundle_id`, `project_id`, unique together

**`bundle_purchases`** — record of bundle sales (separate from per-product `purchases` so the buyer gets all included projects)
- `bundle_id`, `buyer_id`, `amount_paid`, `stripe_session_id`, `created_at`

RLS: creators manage their own rows; public read for active/published; buyers read their own bundle_purchases.

Eligibility validation (matches itch.io rule): when adding a project to a sale, validate that the project is "downloadable" (has `digital_products` with `asset_url`) and has a `price > 0` (or files with min price). Enforced server-side via a check function called from the UI.

### UI (`src/pages/DashboardSales.tsx` rewrite)

Tabs: **Sales** · **Bundles** · **History**

**Sales tab**
- Explanation banner (the text the user provided about how sales work)
- Active sales list, scheduled sales list
- "Create a sale" button → modal: name, discount %, start/end date, multi-select eligible projects (ineligible ones disabled with reason)

**Bundles tab**
- Bundle cards: title, # projects, price, status
- "Create a bundle" button → form: title, description, cover, price, multi-select projects (must be the creator's, must be downloadable)
- Edit / Publish / Unpublish actions

**History tab** — existing transaction history (was the entire page before).

### Marketplace integration
- Marketplace product cards check active sales and show discounted price + strikethrough.
- Bundle pages get a public route `/bundles/:bundleId` (later — listed as out of scope for this iteration, surface as Coming Soon button on bundle detail).

## 6. Routes (`src/App.tsx`)

Add:
```text
/library                        Library (auth)
/library/reviews                LibraryReviews (auth)
/library/recommendations        LibraryRecommendations (auth)
/dashboard/upload               DashboardProjectNew (alias)
/dashboard/devlogs              DashboardDevlogs (auth)
/dashboard/devlogs/new          DashboardDevlogEdit (auth)
/dashboard/devlogs/:id/edit     DashboardDevlogEdit (auth)
```

Keep existing `/dashboard/projects/*` routes for backwards compatibility but stop linking to them from the sidebar.

## Out of scope (this iteration)

- Public bundle detail/checkout page — mark "coming soon" once bundles can be created.
- Stripe Checkout integration for bundles (requires webhook work; the create-bundle UI saves drafts only until checkout is wired).
- Sale price application at marketplace checkout — UI shows discounted price; actual discount at checkout is a follow-up.
- Recommendation algorithm beyond "most popular in your purchased categories".

## Technical notes

- All new pages use the existing `DashboardLayout` / `MainLayout` patterns and design tokens — no new colors, follow the Cool Blue-Gray system already in `index.css`.
- New tables get RLS policies modeled on existing `digital_products` / `projects` patterns.
- Use a security definer function `is_project_sale_eligible(project_id uuid)` to centralize eligibility logic.
- Update memory `mem://features/marketplace/payment-model` after bundles checkout is implemented (follow-up task).
