

# FanRealms Pivot: Marketplace, Job Board, and Forum

## Overview

Transform FanRealms from a subscription-based creator platform into a three-pillar platform: Marketplace (one-time purchases), Job Board (gigs/bounties), and Forum (devlogs/community). This builds on top of existing infrastructure — no rewrites.

## Architecture Summary

```text
┌─────────────────────────────────────────────────┐
│                  Existing Auth                  │
│            (users, creators, profiles)          │
├─────────────┬──────────────┬────────────────────┤
│  Marketplace│   Job Board  │      Forum         │
│             │              │                    │
│ digital_    │ job_listings │ forum_threads      │
│ products    │ job_apps     │ forum_replies      │
│ purchases   │              │                    │
├─────────────┴──────────────┴────────────────────┤
│     Stripe (one-time sessions) │ Mailgun alerts │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: Database Migrations

### 1A. Marketplace Tables

**`digital_products`** — Sellers list downloadable assets/expertise.
- `id`, `creator_id` (FK to creators), `title`, `description`, `price` (numeric), `asset_url`, `cover_image_url`, `category` (text), `tags` (text[]), `status` (draft/published/archived), `stripe_price_id`, timestamps.
- RLS: public read for published; creator-only write.

**`purchases`** — Records of completed one-time buys.
- `id`, `buyer_id` (auth.uid), `product_id`, `creator_id`, `amount`, `platform_fee`, `net_amount`, `stripe_session_id`, `stripe_payment_intent_id`, `status` (pending/completed/refunded), timestamps.
- RLS: buyers see own purchases; creators see sales of their products; service_role inserts.

### 1B. Job Board Tables

**`job_listings`** — Gigs and bounties posted by any authenticated user.
- `id`, `poster_id` (auth.uid), `title`, `description`, `requirements` (text), `category` (enum or text: "Game Dev", "Data Science", "iOS", "Web", "Design", "Other"), `budget_min`/`budget_max` (numeric), `budget_type` (fixed/hourly/bounty), `status` (open/in_progress/filled/closed), `tags` (text[]), `deadline`, timestamps.
- RLS: public read for open listings; poster-only write.

**`job_applications`** — Users apply to listings.
- `id`, `listing_id`, `applicant_id`, `cover_letter`, `portfolio_url`, `status` (pending/accepted/rejected), timestamps.
- RLS: applicants see own; poster sees applications on their listings.

### 1C. Forum Tables

**`forum_threads`** — Top-level discussion posts (replaces/extends devlogs concept).
- `id`, `author_id` (auth.uid), `title`, `content` (text, supports markdown/rich text), `category` (text), `tags` (text[]), `is_pinned`, `is_locked`, `view_count`, `reply_count`, `status` (published/archived), timestamps.
- RLS: public read for published; author-only write.

**`forum_replies`** — Replies to threads.
- `id`, `thread_id`, `author_id`, `content`, `parent_reply_id` (nullable, for nested replies), timestamps.
- RLS: public read; authenticated insert; author-only update/delete.

---

## Phase 2: Edge Functions / Backend

### 2A. Marketplace Checkout (`create-product-checkout`)

New edge function that creates a **Stripe Checkout Session** in `payment` mode (one-time) instead of `subscription` mode. Key differences from existing `simple-subscriptions`:
- Uses `stripe.checkout.sessions.create({ mode: 'payment', line_items: [...] })` with the product's `stripe_price_id`
- On success webhook, inserts into `purchases` table and triggers creator earnings record
- Applies platform fee via `payment_intent_data.application_fee_amount` (Stripe Connect)

### 2B. Job Alert Notifications (`send-job-alert`)

New edge function triggered by a database trigger on `job_listings` INSERT:
- Queries users who have matching category/tag preferences (stored in existing `users` preferences or a new `job_alert_preferences` table)
- Calls Mailgun API to send notification emails
- Uses existing Mailgun secret

### 2C. Stripe Webhook Update

Update existing `stripe-webhook` to handle `checkout.session.completed` events for one-time payments (in addition to existing subscription events), recording the purchase.

---

## Phase 3: Frontend Components

### 3A. Marketplace

**New files:**
- `src/pages/Marketplace.tsx` — Grid of product cards with category filters
- `src/pages/ProductDetail.tsx` — Full product page with checkout button
- `src/components/marketplace/ProductCard.tsx` — Card component (cover image, title, price, creator avatar)
- `src/components/marketplace/CreateProductDialog.tsx` — Form for sellers
- `src/hooks/useMarketplace.ts` — CRUD hooks for digital_products + purchase flow
- `src/pages/creator-studio/Products.tsx` — Seller's product management page

**Styling:** Matches existing patterns — uses `Card`, `Badge`, `Button`, `Skeleton` from `@/components/ui`, `container mx-auto p-6 space-y-8` layout, `useQuery`/`useMutation` from TanStack Query.

### 3B. Job Board

**New files:**
- `src/pages/Jobs.tsx` — List view with category filter tabs (Game Dev, Data Science, iOS, Web, Design)
- `src/pages/JobDetail.tsx` — Full listing with apply button
- `src/components/jobs/JobListingCard.tsx` — Compact list item (title, budget, category badge, deadline)
- `src/components/jobs/CreateJobDialog.tsx` — Post a job form
- `src/components/jobs/JobApplicationDialog.tsx` — Apply modal
- `src/hooks/useJobs.ts` — CRUD hooks for listings and applications

### 3C. Forum

**New files:**
- `src/pages/Forum.tsx` — Thread list with category/tag filtering
- `src/pages/ForumThread.tsx` — Thread view with replies, supports markdown rendering (using `react-markdown` + `react-syntax-highlighter` for code blocks)
- `src/components/forum/ThreadCard.tsx` — Thread preview card
- `src/components/forum/CreateThreadDialog.tsx` — New thread with rich text
- `src/components/forum/ReplyEditor.tsx` — Reply composer with code snippet support
- `src/hooks/useForum.ts` — CRUD hooks for threads and replies

### 3D. Navigation Updates

Update `src/components/Layout/Sidebar/MainNavigation.tsx` to add three new nav items:
- **Marketplace** (`/marketplace`, `Store` icon)
- **Jobs** (`/jobs`, `Briefcase` icon)
- **Forum** (`/forum`, `MessagesSquare` icon)

### 3E. Routing Updates

Add to `src/App.tsx`:
- `/marketplace` — MarketplacePage
- `/marketplace/:productId` — ProductDetailPage
- `/jobs` — JobsPage
- `/jobs/:jobId` — JobDetailPage
- `/forum` — ForumPage
- `/forum/:threadId` — ForumThreadPage
- `/creator-studio/products` — Creator product management

All wrapped with `AuthGuard` + `MainLayout` (public pages like marketplace browsing can skip AuthGuard).

---

## Technical Details

### Dependencies to Add
- `react-markdown` — Render markdown in forum posts
- `react-syntax-highlighter` — Code block highlighting in forum
- `@tailwindcss/typography` — Prose styling for forum content

### Stripe Integration Change
The key architectural shift: existing `simple-subscriptions` edge function uses `stripe.subscriptions.create()`. The new marketplace function uses `stripe.checkout.sessions.create({ mode: 'payment' })`. Both coexist — subscriptions remain available for creators who want them, while marketplace uses one-time payments.

### Migration Strategy
No existing tables are dropped. The subscription system remains intact. New tables are additive. The sidebar navigation expands to include the three new pillars alongside existing features.

