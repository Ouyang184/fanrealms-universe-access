# Creator Dashboard Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the creator gate so all users can create assets from day one, redesign the dashboard to be creation-first, and rework the upload form to an itch.io-style two-column layout.

**Architecture:** Three coordinated changes — (1) remove the `isCreator` gate in the sidebar and nav, (2) rewrite `Dashboard.tsx` with stats + asset list + recent sales + purchases, (3) rewrite `DashboardAssetDetail.tsx` with a two-column form layout where cover/trailer/screenshots live in the sidebar and the left column holds all the editing fields with a pricing radio group and visibility radio. A Supabase migration adds `trailer_url` to `digital_products` first.

**Tech Stack:** React 18, TypeScript, TanStack Query, Tailwind CSS, shadcn/ui, Supabase, React Router v6, Sonner toasts

---

## File Structure

| File | Action | Notes |
|---|---|---|
| `supabase/migrations/20260507000000-add-trailer-url.sql` | Create | New column on `digital_products` |
| `src/components/dashboard/DashboardLayout.tsx` | Modify | Remove `isCreator` gate (lines 9, 68, 94-101) |
| `src/App.tsx` | Modify | Add `/become-creator → /dashboard` redirect |
| `src/components/marketplace/MarketplaceSidebar.tsx` | Modify | Rename "Become a creator" link |
| `src/hooks/useMarketplace.ts` | Modify | Add `trailer_url?: string` to create/update types |
| `src/pages/Dashboard.tsx` | Rewrite | Creation-first layout |
| `src/pages/DashboardAssetDetail.tsx` | Rewrite | Two-column itch.io-style layout |

---

## Task 1: Add `trailer_url` column to `digital_products`

**Files:**
- Create: `supabase/migrations/20260507000000-add-trailer-url.sql`

This migration must land before Task 6 (the component rewrite) so the DB accepts the new field.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260507000000-add-trailer-url.sql
ALTER TABLE digital_products ADD COLUMN IF NOT EXISTS trailer_url TEXT;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with:
- `name`: `add_trailer_url_to_digital_products`
- `query`: `ALTER TABLE digital_products ADD COLUMN IF NOT EXISTS trailer_url TEXT;`

- [ ] **Step 3: Verify the column exists**

Use `mcp__plugin_supabase_supabase__execute_sql` with:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'digital_products' AND column_name = 'trailer_url';
```

Expected: one row returned with `column_name = trailer_url`, `data_type = text`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260507000000-add-trailer-url.sql
git commit -m "feat: add trailer_url column to digital_products"
```

---

## Task 2: Remove the creator gate from DashboardLayout

**Files:**
- Modify: `src/components/dashboard/DashboardLayout.tsx`

Currently the CREATE sidebar section (Dashboard, Projects, Assets, Sales) is wrapped in `{isCreator && (...)}`. This task removes that condition so all authenticated users see the CREATE section.

- [ ] **Step 1: Remove the `useCreatorProfile` import and its usage**

Open `src/components/dashboard/DashboardLayout.tsx`.

Remove line 9:
```tsx
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
```

Remove line 68:
```tsx
const { isCreator } = useCreatorProfile();
```

- [ ] **Step 2: Replace the conditional CREATE section with an unconditional one**

Find this block (lines 94–101):
```tsx
          {isCreator && (
            <>
              <Section label="Create" />
              {CREATE.map((it) => (
                <SidebarLink key={it.to} {...it} end={it.to === '/dashboard'} />
              ))}
            </>
          )}
```

Replace with:
```tsx
          <Section label="Create" />
          {CREATE.map((it) => (
            <SidebarLink key={it.to} {...it} end={it.to === '/dashboard'} />
          ))}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors. If there are errors, they will relate to the removed import — fix any remaining references to `isCreator` in this file.

- [ ] **Step 4: Manual verification**

Start dev server (`npm run dev`) and log in with an account that has NOT gone through "Become a Creator". Navigate to `/dashboard`. The sidebar should now show the full CREATE section (Dashboard, Projects, Assets, Sales) for all users.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardLayout.tsx
git commit -m "feat: show CREATE sidebar section to all authenticated users"
```

---

## Task 3: Add `/become-creator` redirect + fix sidebar link

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/marketplace/MarketplaceSidebar.tsx`

Anyone who bookmarked `/become-creator` or follows an old link should be redirected to `/dashboard`. The sidebar "Become a creator" text is also stale now — it should say "Upload an asset".

- [ ] **Step 1: Add the redirect route in App.tsx**

Open `src/App.tsx`. Find the line:
```tsx
                {/* Seller profile — /:username catch-all, must be second-to-last */}
```

Add the redirect **above** the `/:username` catch-all, directly before that comment:
```tsx
                <Route path="/become-creator" element={<Navigate to="/dashboard" replace />} />

                {/* Seller profile — /:username catch-all, must be second-to-last */}
```

`Navigate` is already imported at the top of `App.tsx` (used elsewhere), so no new import is needed.

- [ ] **Step 2: Update the sidebar quick link**

Open `src/components/marketplace/MarketplaceSidebar.tsx`. Find line 136:
```tsx
        <Link to="/dashboard/assets" className="block px-1 py-1 text-[13px] text-foreground hover:underline">Become a creator</Link>
```

Replace with:
```tsx
        <Link to="/dashboard/assets/new" className="block px-1 py-1 text-[13px] text-foreground hover:underline">Upload an asset</Link>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Manual verification**

- Navigate to `/become-creator` in the browser — should redirect to `/dashboard`.
- In the marketplace sidebar, "Quick links" section should show "Upload an asset" linking to `/dashboard/assets/new`.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/marketplace/MarketplaceSidebar.tsx
git commit -m "feat: redirect /become-creator to /dashboard, update sidebar link"
```

---

## Task 4: Add `trailer_url` to `useMarketplace.ts` mutation types

**Files:**
- Modify: `src/hooks/useMarketplace.ts`

The `useCreateProduct` and `useUpdateProduct` hooks need `trailer_url?: string` in their TypeScript types so that `DashboardAssetDetail.tsx` can pass the field without TS errors. The Supabase update/insert calls use spread (`...product`, `...updates`) so the new field is automatically included at runtime.

- [ ] **Step 1: Add `trailer_url` to `useCreateProduct` type**

Open `src/hooks/useMarketplace.ts`. Find the `mutationFn` type inside `useCreateProduct` (around line 94). It looks like:
```ts
    mutationFn: async (product: {
      title: string;
      description?: string;
      short_description?: string;
      price: number;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

Add `trailer_url?: string;` after `asset_url?: string;`:
```ts
    mutationFn: async (product: {
      title: string;
      description?: string;
      short_description?: string;
      price: number;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      trailer_url?: string;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

- [ ] **Step 2: Add `trailer_url` to `useUpdateProduct` type**

Find the `mutationFn` type inside `useUpdateProduct` (around line 164). It looks like:
```ts
    mutationFn: async (product: {
      id: string;
      title?: string;
      description?: string;
      short_description?: string;
      price?: number;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

Add `trailer_url?: string;` after `asset_url?: string;`:
```ts
    mutationFn: async (product: {
      id: string;
      title?: string;
      description?: string;
      short_description?: string;
      price?: number;
      category?: string;
      tags?: string[];
      cover_image_url?: string;
      asset_url?: string;
      trailer_url?: string;
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors. The `trailer_url` field will pass through the existing `...product` and `...updates` spreads without any other changes needed.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMarketplace.ts
git commit -m "feat: add trailer_url to create/update product mutation types"
```

---

## Task 5: Rewrite Dashboard.tsx — creation-first layout

**Files:**
- Rewrite: `src/pages/Dashboard.tsx`

Replace the current purchases-first layout with a creation-first layout: header with "Upload an asset" button, 3 stats cards, all assets as clickable list rows, recent sales section (hidden if no sales), purchases section at the bottom.

- [ ] **Step 1: Replace the entire file content**

Write the following to `src/pages/Dashboard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserPurchases, useCreatorProducts, useSellerSales } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Package, Plus, ExternalLink, Upload } from 'lucide-react';

function DownloadButton({ assetUrl }: { assetUrl: string | null | undefined }) {
  if (!assetUrl) return <span className="text-[11px] text-[#aaa]">No file linked</span>;
  return (
    <a
      href={assetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      Download
    </a>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-[#eee] rounded-xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa] mb-1">{label}</div>
      <div className="text-[28px] font-bold tracking-[-0.5px] text-[#111]">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: purchases, isLoading: purchasesLoading } = useUserPurchases();
  const { data: myAssets, isLoading: assetsLoading } = useCreatorProducts();
  const { data: salesData } = useSellerSales();

  const publishedCount = myAssets?.filter((a) => (a as any).status === 'published').length ?? 0;
  const salesCount = salesData?.sales.length ?? 0;
  const totalEarnings = salesData?.totals.net ?? 0;
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const recentSales = salesData?.sales.slice(0, 5) ?? [];

  return (
    <DashboardLayout>
      <div className="w-full space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Dashboard</h1>
          <Link
            to="/dashboard/assets/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload an asset
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Published assets" value={publishedCount} />
          <StatCard label="Total sales" value={salesCount} />
          <StatCard label="Total earnings" value={fmt(totalEarnings)} />
        </div>

        {/* Your assets */}
        <section>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Your Assets</h2>
          {assetsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (myAssets ?? []).length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {(myAssets ?? []).map((a, i) => (
                <Link
                  key={(a as any).id}
                  to={`/dashboard/assets/${(a as any).id}`}
                  className={`flex items-center gap-4 px-4 py-3 hover:bg-[#fafafa] transition-colors ${
                    i < (myAssets ?? []).length - 1 ? 'border-b border-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {(a as any).cover_image_url && (
                      <img
                        src={(a as any).cover_image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{(a as any).title}</div>
                    <div className="text-[11px] text-[#aaa]">{(a as any).category}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (a as any).status === 'published'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-[#f5f5f5] text-[#888] border border-[#ddd]'
                    }`}
                  >
                    {(a as any).status === 'published' ? 'LIVE' : 'DRAFT'}
                  </span>
                  <div className="text-[13px] font-semibold text-[#333] w-16 text-right">
                    {(a as any).price === 0 ? 'Free' : fmt((a as any).price)}
                  </div>
                </Link>
              ))}
              <div className="px-4 py-3 border-t border-[#f5f5f5]">
                <Link
                  to="/dashboard/assets/new"
                  className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New asset
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
              <Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111] mb-1">No assets yet</p>
              <p className="text-[12px] text-[#999] mb-4">Upload your first Godot asset and start selling.</p>
              <Link
                to="/dashboard/assets/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload an asset
              </Link>
            </div>
          )}
        </section>

        {/* Recent sales — only shown if there are sales */}
        {salesCount > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">Recent sales</h2>
              <Link to="/dashboard/sales" className="text-[13px] font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {recentSales.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    i < recentSales.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {(s.digital_products as any)?.title ?? 'Asset'}
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-primary">{fmt(s.net_amount ?? 0)}</div>
                  <div className="text-[11px] text-[#aaa]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Purchases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">Purchases</h2>
            <Link to="/marketplace" className="text-[13px] font-semibold text-primary hover:underline">
              Browse marketplace
            </Link>
          </div>

          {purchasesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : purchases && purchases.length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {purchases.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    i < purchases.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {(p.digital_products as any)?.cover_image_url && (
                      <img
                        src={(p.digital_products as any).cover_image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {(p.digital_products as any)?.title ?? 'Asset'}
                    </div>
                    <div className="text-[11px] text-[#aaa]">
                      by {(p.creators as any)?.display_name || (p.creators as any)?.username}
                    </div>
                  </div>
                  <DownloadButton assetUrl={(p.digital_products as any)?.asset_url} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
              <ShoppingBag className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111] mb-1">No purchases yet</p>
              <p className="text-[12px] text-[#999] mb-4">Browse the marketplace to find Godot assets.</p>
              <Link
                to="/marketplace"
                className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors"
              >
                Browse marketplace
              </Link>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Manual verification**

Navigate to `/dashboard` while logged in. Verify:
- Header row has "Dashboard" title and "Upload an asset" button (links to `/dashboard/assets/new`)
- Three stat cards: "Published assets", "Total sales", "Total earnings"
- Your Assets section shows all assets as list rows (cover thumb, title, category, LIVE/DRAFT badge, price). Clicking a row navigates to `/dashboard/assets/:id`.
- Your Assets empty state shows large upload CTA
- Recent sales section is hidden when there are no sales; appears with last 5 sales and "View all →" when sales exist
- Purchases section is at the bottom

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: rewrite dashboard with creation-first layout and stats"
```

---

## Task 6: Rewrite DashboardAssetDetail.tsx — two-column itch.io-style layout

**Files:**
- Rewrite: `src/pages/DashboardAssetDetail.tsx`

**Prerequisites:** Tasks 1 and 4 must be complete (migration + useMarketplace types).

Replace the single-column form with a two-column layout: left column has the main fields (title, tagline, category, Godot version, pricing radio, download URL, description, collapsible Advanced, visibility radio, save buttons); right sidebar has cover image, trailer URL, screenshots, sales stats, and actions.

Key changes from the existing component:
- Cover image moves from top of left column to top of right sidebar
- New `priceMode` state (`'free' | 'paid' | 'name_your_price'`) replaces the single price number input
- New `trailerUrl` state stored in `trailer_url` DB column
- Toggle replaced with visibility radio (draft / published)
- Version, License, Tags moved into a collapsible "Advanced" `<details>`-style section
- "Save & view page" button (primary): saves with current status; if existing+published, navigates to `/marketplace/:id`; otherwise stays on page
- "Save as draft" button (secondary): saves with `status='draft'` and stays on page

- [ ] **Step 1: Replace the entire file content**

Write the following to `src/pages/DashboardAssetDetail.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSellerSales,
} from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Plus, X, Loader2, ExternalLink, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  'Plugins & Addons', 'Shaders', 'Scripts & Systems', '2D Assets', '3D Assets',
  'Complete Games', 'Templates', 'Tools', 'Tutorials', 'Music & SFX', 'Other',
];
const GODOT_VERSIONS = ['Godot 4.3+', 'Godot 4.2', 'Godot 4.1', 'Godot 4.0', 'Godot 3.x', 'Any / Not applicable'];
const LICENSES = ['Standard', 'Creative Commons (CC BY)', 'Creative Commons (CC BY-SA)', 'MIT', 'Public Domain'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_COVER_SIZE_MB = 5;

type PriceMode = 'free' | 'paid' | 'name_your_price';

export default function DashboardAssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = assetId === 'new';

  const { data: product, isLoading: productLoading } = useProduct(isNew ? '' : assetId ?? '');
  const { data: salesData } = useSellerSales();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const assetSales = (salesData?.sales ?? []).filter((s: any) => s.product_id === assetId);
  const assetGross = assetSales.reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0);
  const assetNet = assetSales.reduce((sum: number, s: any) => sum + (s.net_amount ?? 0), 0);
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceMode, setPriceMode] = useState<PriceMode>('free');
  const [priceStr, setPriceStr] = useState('');
  const [category, setCategory] = useState('Plugins & Addons');
  const [godotVersion, setGodotVersion] = useState('Godot 4.3+');
  const [tagsStr, setTagsStr] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [version, setVersion] = useState('');
  const [license, setLicense] = useState('Standard');
  const [screenshots, setScreenshots] = useState<string[]>(['']);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (product && !isNew) {
      const p = product as any;
      setTitle(p.title ?? '');
      setShortDescription(p.short_description ?? '');
      setDescription(p.description ?? '');
      const price = p.price ?? 0;
      if (price > 0) {
        setPriceMode('paid');
        setPriceStr((price / 100).toFixed(2));
      } else {
        setPriceMode('free');
        setPriceStr('');
      }
      setCategory(p.category ?? 'Plugins & Addons');
      setGodotVersion(p.godot_version ?? 'Godot 4.3+');
      setTagsStr((p.tags ?? []).join(', '));
      setDownloadUrl(p.asset_url ?? '');
      setTrailerUrl(p.trailer_url ?? '');
      setVersion(p.version ?? '');
      setLicense(p.license ?? 'Standard');
      setScreenshots(p.screenshots?.length ? p.screenshots : ['']);
      setStatus(p.status === 'published' ? 'published' : 'draft');
      setCoverPreview(p.cover_image_url ?? null);
    }
  }, [product, isNew]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Cover must be a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
      toast.error(`Cover image must be smaller than ${MAX_COVER_SIZE_MB}MB`);
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile || !user) return null;
    const ext = coverFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, coverFile, { upsert: true });
    if (error) { toast.error('Cover upload failed: ' + error.message); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const addScreenshot = () => setScreenshots(s => [...s, '']);
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, val: string) =>
    setScreenshots(s => s.map((v, idx) => (idx === i ? val : v)));

  const buildPayload = (overrideStatus?: 'draft' | 'published') => {
    const finalStatus = overrideStatus ?? status;
    let priceInCents = 0;
    if (priceMode === 'paid') {
      priceInCents = Math.round(parseFloat(priceStr || '0') * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        toast.error('Please enter a valid price greater than $0');
        return null;
      }
    }
    // name_your_price: stores price=0 per spec (full implementation is a follow-up)
    return {
      title: title.trim(),
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      price: priceInCents,
      category,
      godot_version: godotVersion !== 'Any / Not applicable' ? godotVersion : undefined,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      asset_url: downloadUrl.trim() || undefined,
      trailer_url: trailerUrl.trim() || undefined,
      screenshots: screenshots.map(s => s.trim()).filter(Boolean),
      version: version.trim() || undefined,
      license,
      status: finalStatus,
    };
  };

  // Returns the saved asset ID on success, null on failure.
  const doSave = async (overrideStatus?: 'draft' | 'published'): Promise<string | null> => {
    if (!title.trim()) { toast.error('Title is required'); return null; }
    const finalStatus = overrideStatus ?? status;
    if (finalStatus === 'published' && !downloadUrl.trim()) {
      toast.error('A download URL is required to publish');
      return null;
    }
    const payload = buildPayload(overrideStatus);
    if (!payload) return null;

    setSaving(true);
    try {
      let coverImageUrl = (product as any)?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) coverImageUrl = uploaded;
      }
      const fullPayload = { ...payload, cover_image_url: coverImageUrl ?? undefined };

      if (isNew) {
        const created = await createProduct.mutateAsync(fullPayload);
        return (created as any).id;
      } else {
        await updateProduct.mutateAsync({ id: assetId!, ...fullPayload });
        return assetId!;
      }
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndView = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedId = await doSave();
    if (!savedId) return;
    if (isNew) {
      navigate(`/dashboard/assets/${savedId}`, { replace: true });
    } else if (status === 'published') {
      navigate(`/marketplace/${savedId}`);
    }
    // draft + existing: mutation already shows toast, we stay on page
  };

  const handleSaveAsDraft = async () => {
    const savedId = await doSave('draft');
    if (!savedId) return;
    setStatus('draft');
    if (isNew) {
      navigate(`/dashboard/assets/${savedId}`, { replace: true });
    }
    // existing: mutation already shows toast
  };

  const handleDelete = async () => {
    if (!assetId || isNew) return;
    await deleteProduct.mutateAsync(assetId);
    navigate('/dashboard/assets', { replace: true });
  };

  if (!isNew && !productLoading && !product) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-[15px] font-semibold text-[#111] mb-2">Asset not found</p>
          <Link to="/dashboard/assets" className="text-primary text-[13px] hover:underline">
            ← Back to your assets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <Link
          to="/dashboard/assets"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Your assets
        </Link>

        <h1 className="text-[20px] font-bold tracking-[-0.5px]">
          {isNew ? 'New asset' : (productLoading ? '…' : (product as any)?.title)}
        </h1>

        {!isNew && productLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

            {/* LEFT COLUMN — main form fields */}
            <form onSubmit={handleSaveAndView} className="space-y-6">

              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Godot Shader Pack Vol.1"
                  required
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Tagline{' '}
                  <span className="font-normal text-[#999]">(one line shown on listing cards)</span>
                </label>
                <Input
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="e.g. 20 ready-to-use shaders for Godot 4"
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Godot Version</label>
                  <select
                    value={godotVersion}
                    onChange={e => setGodotVersion(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {GODOT_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Pricing radio group */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-2">Pricing</label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priceMode"
                      value="free"
                      checked={priceMode === 'free'}
                      onChange={() => setPriceMode('free')}
                      className="accent-primary"
                    />
                    <span className="text-[13px] font-medium text-[#333]">Free</span>
                    <span className="text-[12px] text-[#999]">Anyone can download</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priceMode"
                      value="paid"
                      checked={priceMode === 'paid'}
                      onChange={() => setPriceMode('paid')}
                      className="accent-primary"
                    />
                    <span className="text-[13px] font-medium text-[#333]">Paid</span>
                    {priceMode === 'paid' && (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-[13px] text-[#555]">$</span>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={priceStr}
                          onChange={e => setPriceStr(e.target.value)}
                          placeholder="0.00"
                          className="w-24 h-7 text-[13px]"
                        />
                      </div>
                    )}
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priceMode"
                      value="name_your_price"
                      checked={priceMode === 'name_your_price'}
                      onChange={() => setPriceMode('name_your_price')}
                      className="accent-primary"
                    />
                    <span className="text-[13px] font-medium text-[#333]">Name your price</span>
                    {priceMode === 'name_your_price' && (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-[12px] text-[#999]">min $</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceStr}
                          onChange={e => setPriceStr(e.target.value)}
                          placeholder="0.00"
                          className="w-24 h-7 text-[13px]"
                        />
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Download URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={downloadUrl}
                  onChange={e => setDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://mega.nz/..."
                  type="url"
                />
                <p className="text-[11px] text-[#aaa] mt-0.5">
                  Google Drive, MEGA, Dropbox, or any direct link. Buyers see this only after purchase.
                </p>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Full description{' '}
                  <span className="font-normal text-[#999]">(shown on product page)</span>
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={"What's included?\nWho is it for?\nHow do you use it?"}
                  rows={6}
                />
              </div>

              {/* Collapsible Advanced section */}
              <div className="border border-[#eee] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-[#333] hover:bg-[#fafafa] transition-colors"
                >
                  <span>Advanced</span>
                  {advancedOpen
                    ? <ChevronDown className="w-4 h-4 text-[#888]" />
                    : <ChevronRight className="w-4 h-4 text-[#888]" />
                  }
                </button>
                {advancedOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-[#eee]">
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div>
                        <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Version</label>
                        <Input
                          value={version}
                          onChange={e => setVersion(e.target.value)}
                          placeholder="e.g. 1.0.0"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[#333] block mb-1.5">License</label>
                        <select
                          value={license}
                          onChange={e => setLicense(e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Tags</label>
                      <Input
                        value={tagsStr}
                        onChange={e => setTagsStr(e.target.value)}
                        placeholder="godot4, shader, 2d (comma-separated)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Visibility radio */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-2">Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="draft"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                      className="accent-primary mt-0.5"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#333]">Draft</span>
                      <span className="text-[12px] text-[#999] ml-2">Only you can see this</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="published"
                      checked={status === 'published'}
                      onChange={() => setStatus('published')}
                      className="accent-primary mt-0.5"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#333]">Public</span>
                      <span className="text-[12px] text-[#999] ml-2">Visible to everyone on the marketplace</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-[#3a7aab] text-white font-semibold"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    : 'Save & view page'
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleSaveAsDraft}
                  className="font-semibold"
                >
                  Save as draft
                </Button>
              </div>
            </form>

            {/* RIGHT SIDEBAR */}
            <aside className="lg:sticky lg:top-20 space-y-4">

              {/* Cover image */}
              <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Cover image</h3>
                <div
                  className="w-full aspect-video bg-[#f5f5f5] border border-[#eee] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors"
                  onClick={() => document.getElementById('cover-input-page')?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center text-[#aaa] p-4">
                      <Upload className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-[11px]">Click to upload (16:9)</span>
                    </div>
                  )}
                  <input
                    id="cover-input-page"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
              </div>

              {/* Trailer URL */}
              <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Trailer URL</h3>
                <Input
                  value={trailerUrl}
                  onChange={e => setTrailerUrl(e.target.value)}
                  placeholder="https://youtu.be/... or https://vimeo.com/..."
                  type="url"
                />
                <p className="text-[11px] text-[#aaa]">YouTube or Vimeo link shown on the product page</p>
              </div>

              {/* Screenshots */}
              <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Screenshots</h3>
                <div className="space-y-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={url}
                        onChange={e => updateScreenshot(i, e.target.value)}
                        placeholder="https://i.imgur.com/..."
                        type="url"
                        className="text-[12px]"
                      />
                      {screenshots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScreenshot(i)}
                          className="p-1.5 text-[#aaa] hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {screenshots.length < 5 && (
                    <button
                      type="button"
                      onClick={addScreenshot}
                      className="flex items-center gap-1 text-[12px] text-primary hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add screenshot
                    </button>
                  )}
                </div>
              </div>

              {/* Sales stats (existing assets only) */}
              {!isNew && (
                <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Sales</h3>
                  {assetSales.length === 0 ? (
                    <p className="text-[13px] text-[#aaa]">No sales yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-[#aaa] mb-0.5">Total sales</div>
                        <div className="text-[22px] font-bold tracking-[-0.5px]">{assetSales.length}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#aaa] mb-0.5">Your earnings</div>
                        <div className="text-[22px] font-bold tracking-[-0.5px] text-primary">{fmt(assetNet)}</div>
                        <div className="text-[11px] text-[#aaa]">{fmt(assetGross)} gross</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Actions</h3>
                {!isNew && (
                  <Link
                    to={`/marketplace/${assetId}`}
                    className="flex items-center gap-2 text-[13px] text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View public page
                  </Link>
                )}
                {!isNew && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex items-center gap-2 text-[13px] text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete asset
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the asset from the marketplace. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={handleDelete}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {isNew && (
                  <p className="text-[12px] text-[#aaa]">Save your asset to see stats and actions.</p>
                )}
              </div>

            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors. If `trailer_url` causes a type error, confirm Task 4 was completed first.

- [ ] **Step 3: Manual verification — new asset form**

Navigate to `/dashboard/assets/new`. Verify:
- Two-column layout visible on desktop (≥1024px)
- Left column has: Title*, Tagline, Category+Godot Version dropdowns, Pricing radio (Free/Paid/Name your price), Download URL*, Full description, Advanced collapsible (Version/License/Tags inside), Visibility radio (Draft/Public), "Save & view page" and "Save as draft" buttons
- Right sidebar has: Cover image upload (16:9 aspect), Trailer URL input, Screenshots (up to 5), Actions section ("Save your asset to see stats and actions")
- Selecting "Paid" shows inline `$` + price input
- Selecting "Name your price" shows inline `min $` + input
- Clicking "Advanced" expands the section revealing Version, License, Tags fields
- Clicking "Save as draft" with a title creates the asset and navigates to `/dashboard/assets/:id`
- Clicking "Save & view page" with a published public asset navigates to `/marketplace/:id`

- [ ] **Step 4: Manual verification — editing existing asset**

Navigate to `/dashboard/assets/:id` for an existing asset. Verify:
- Form pre-fills with existing values (title, description, etc.)
- Price pre-fills correctly: free assets → "Free" radio selected; paid assets → "Paid" selected with price value
- Cover image shows existing cover as preview
- Trailer URL field loads from DB (blank if none set)
- Sales sidebar shows stats (or "No sales yet")
- "Save & view page" on a draft asset stays on page after save
- "Save & view page" on a published asset navigates to marketplace

- [ ] **Step 5: Commit**

```bash
git add src/pages/DashboardAssetDetail.tsx
git commit -m "feat: rewrite asset detail with itch.io two-column layout, pricing radio, trailer URL"
```

---

## Post-implementation: Push to main

After all 6 tasks pass their verification steps:

```bash
git pull --rebase origin main
git push origin main
```

Note: Lovable may have pushed commits while you were working. The `--rebase` keeps your commits on top cleanly. If there are conflicts, they will most likely be in `src/App.tsx` or `src/pages/Dashboard.tsx` — resolve by keeping your version of the changed sections while preserving any new Lovable additions.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Part 1 (Remove creator gate): Task 2 covers DashboardLayout, Task 3 covers App.tsx redirect. `Dashboard.tsx` "Become a Creator" banner is gone because Task 5 rewrites the whole file without it.
- ✅ Part 2 (Dashboard rework): Task 5 — header with Upload button, 3 stat cards, all assets as list rows (published + drafts), New asset link, empty state CTA, recent sales section (hidden if 0), purchases at bottom.
- ✅ Part 3 (Upload form): Task 6 — two-column layout, cover in sidebar, trailer URL in sidebar, screenshots in sidebar, pricing radio (free/paid/name your price), download URL with helper text, full description, collapsible Advanced (version/license/tags), visibility radio, Save & view page + Save as draft buttons.
- ✅ `trailer_url` migration: Task 1.
- ✅ `useMarketplace.ts` types: Task 4.

**Dependencies correctly ordered:**
- Task 1 (migration) before Task 6 (uses trailer_url)
- Task 4 (types) before Task 6 (TypeScript will error otherwise)
- Tasks 2, 3, 5 are independent and can run in any order
