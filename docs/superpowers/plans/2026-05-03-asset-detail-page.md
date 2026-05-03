# Asset Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/dashboard/assets/:id` (and `/dashboard/assets/new`) — a full-page itch.io-style asset management page with edit form and per-asset sales stats, replacing the current `AssetFormDialog`.

**Architecture:** One new page component `DashboardAssetDetail.tsx` handles both new (empty form, `useCreateProduct`) and edit (prefilled form + stats sidebar, `useUpdateProduct`). `DashboardAssets.tsx` is updated to navigate to the detail page instead of opening a dialog. `AssetFormDialog` stays in the codebase (still used by `DashboardProjectDetail`) but is removed from `DashboardAssets`.

**Tech Stack:** React 18, React Router v6, TanStack Query, Supabase JS, TypeScript, Tailwind CSS, shadcn/ui

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/pages/DashboardAssetDetail.tsx` | **Create** | Full-page edit form + stats sidebar for a single asset |
| `src/pages/DashboardAssets.tsx` | **Modify** | Replace dialog with navigation links; keep inline delete |
| `src/App.tsx` | **Modify** | Add `/dashboard/assets/new` and `/dashboard/assets/:assetId` routes |

---

## Task 1: Create `DashboardAssetDetail.tsx`

**Files:**
- Create: `src/pages/DashboardAssetDetail.tsx`

- [ ] **Step 1: Create the file**

Create `src/pages/DashboardAssetDetail.tsx` with the full implementation:

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
import { ArrowLeft, Upload, Plus, X, Loader2, ExternalLink, Trash2 } from 'lucide-react';

const CATEGORIES = [
  'Plugins & Addons', 'Shaders', 'Scripts & Systems', '2D Assets', '3D Assets',
  'Complete Games', 'Templates', 'Tools', 'Tutorials', 'Music & SFX', 'Other',
];
const GODOT_VERSIONS = ['Godot 4.3+', 'Godot 4.2', 'Godot 4.1', 'Godot 4.0', 'Godot 3.x', 'Any / Not applicable'];
const LICENSES = ['Standard', 'Creative Commons (CC BY)', 'Creative Commons (CC BY-SA)', 'MIT', 'Public Domain'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_COVER_SIZE_MB = 5;

export default function DashboardAssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = assetId === 'new';

  // Data hooks
  const { data: product, isLoading: productLoading } = useProduct(isNew ? '' : assetId ?? '');
  const { data: salesData } = useSellerSales();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Per-asset sales stats (filter from all seller sales)
  const assetSales = (salesData?.sales ?? []).filter(
    (s: any) => s.product_id === assetId
  );
  const assetGross = assetSales.reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0);
  const assetNet = assetSales.reduce((sum: number, s: any) => sum + (s.net_amount ?? 0), 0);
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('0');
  const [category, setCategory] = useState('Plugins & Addons');
  const [godotVersion, setGodotVersion] = useState('Godot 4.3+');
  const [tagsStr, setTagsStr] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [version, setVersion] = useState('');
  const [license, setLicense] = useState('Standard');
  const [screenshots, setScreenshots] = useState<string[]>(['']);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (product && !isNew) {
      const p = product as any;
      setTitle(p.title ?? '');
      setShortDescription(p.short_description ?? '');
      setDescription(p.description ?? '');
      setPriceStr(p.price === 0 ? '0' : (p.price / 100).toFixed(2));
      setCategory(p.category ?? 'Plugins & Addons');
      setGodotVersion(p.godot_version ?? 'Godot 4.3+');
      setTagsStr((p.tags ?? []).join(', '));
      setDownloadUrl(p.asset_url ?? '');
      setVersion(p.version ?? '');
      setLicense(p.license ?? 'Standard');
      setScreenshots(p.screenshots?.length ? p.screenshots : ['']);
      setStatus(p.status === 'published' ? 'published' : 'draft');
      setCoverPreview(p.cover_image_url ?? null);
    }
  }, [product, isNew]);

  // Cover image handlers
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

  // Screenshot helpers
  const addScreenshot = () => setScreenshots(s => [...s, '']);
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, val: string) =>
    setScreenshots(s => s.map((v, idx) => (idx === i ? val : v)));

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (status === 'published' && !downloadUrl.trim()) {
      toast.error('A download URL is required to publish');
      return;
    }
    const priceInCents = Math.round(parseFloat(priceStr || '0') * 100);
    if (isNaN(priceInCents) || priceInCents < 0) {
      toast.error('Please enter a valid price (0 or greater)');
      return;
    }

    setSaving(true);
    try {
      let coverImageUrl = (product as any)?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) coverImageUrl = uploaded;
      }

      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        price: priceInCents,
        category,
        godot_version: godotVersion !== 'Any / Not applicable' ? godotVersion : undefined,
        tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
        cover_image_url: coverImageUrl ?? undefined,
        asset_url: downloadUrl.trim() || undefined,
        screenshots: screenshots.map(s => s.trim()).filter(Boolean),
        version: version.trim() || undefined,
        license,
        status,
      };

      if (isNew) {
        const created = await createProduct.mutateAsync(payload);
        toast.success('Asset created!');
        navigate(`/dashboard/assets/${(created as any).id}`, { replace: true });
      } else {
        await updateProduct.mutateAsync({ id: assetId!, ...payload });
        toast.success('Changes saved');
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!assetId || isNew) return;
    await deleteProduct.mutateAsync(assetId);
    navigate('/dashboard/assets', { replace: true });
  };

  // Not found / wrong owner guard
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
        {/* Back link */}
        <Link
          to="/dashboard/assets"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Your assets
        </Link>

        {/* Page title */}
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">
            {isNew ? 'New asset' : (productLoading ? '…' : (product as any)?.title)}
          </h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            {isNew ? 'Fill in the details and save to publish' : 'Edit your listing'}
          </p>
        </div>

        {!isNew && productLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
            {/* Left — Edit form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Cover image */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Cover image</label>
                <div
                  className="w-full aspect-[16/9] bg-[#f5f5f5] border border-[#eee] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors relative"
                  onClick={() => document.getElementById('cover-input-page')?.click()}
                >
                  {coverPreview ? (
                    <img src={coverPreview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center text-[#aaa]">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-[12px]">Click to upload cover (16:9 recommended)</span>
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

              {/* Title */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Title *</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Godot Shader Pack Vol.1"
                  required
                />
              </div>

              {/* Tagline */}
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

              {/* Full description */}
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

              {/* Screenshots */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Screenshots{' '}
                  <span className="font-normal text-[#999]">(image URLs, shown in gallery)</span>
                </label>
                <div className="space-y-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={url}
                        onChange={e => updateScreenshot(i, e.target.value)}
                        placeholder="https://i.imgur.com/..."
                        type="url"
                      />
                      {screenshots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScreenshot(i)}
                          className="p-2 text-[#aaa] hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
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

              {/* Category + Godot Version */}
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

              {/* Price */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Price (USD)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  placeholder="0.00"
                  className="max-w-[160px]"
                />
                <p className="text-[11px] text-[#aaa] mt-0.5">Set 0 for free</p>
              </div>

              {/* Version + License */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Tags */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Tags</label>
                <Input
                  value={tagsStr}
                  onChange={e => setTagsStr(e.target.value)}
                  placeholder="godot4, shader, 2d (comma-separated)"
                />
              </div>

              {/* Download URL */}
              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Download URL *</label>
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

              {/* Publish toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    status === 'published' ? 'bg-primary' : 'bg-[#ddd]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      status === 'published' ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-[13px] text-[#555]">
                  {status === 'published'
                    ? 'Published — visible to everyone'
                    : 'Draft — only you can see it'}
                </span>
              </div>

              {/* Save */}
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-[#3a7aab] text-white font-semibold"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                ) : isNew ? (
                  'Create asset'
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>

            {/* Right — Sidebar */}
            <aside className="lg:sticky lg:top-20 space-y-4">
              {/* Stats — only shown when editing an existing asset */}
              {!isNew && (
                <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
                    Sales
                  </h3>
                  {assetSales.length === 0 ? (
                    <p className="text-[13px] text-[#aaa]">No sales yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-[#aaa] mb-0.5">Total sales</div>
                        <div className="text-[22px] font-bold tracking-[-0.5px]">
                          {assetSales.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#aaa] mb-0.5">Your earnings</div>
                        <div className="text-[22px] font-bold tracking-[-0.5px] text-primary">
                          {fmt(assetNet)}
                        </div>
                        <div className="text-[11px] text-[#aaa]">
                          {fmt(assetGross)} gross
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
                  Actions
                </h3>

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
                  <p className="text-[12px] text-[#aaa]">
                    Save your asset to see stats and actions.
                  </p>
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

- [ ] **Step 2: Verify build**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardAssetDetail.tsx
git commit -m "feat(dashboard): add individual asset management page at /dashboard/assets/:id"
```

---

## Task 2: Register routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read `src/App.tsx` to find the import block and the dashboard routes section**

- [ ] **Step 2: Add the import**

After the existing `import DashboardAssetsPage` line, add:

```tsx
import DashboardAssetDetail from "./pages/DashboardAssetDetail";
```

- [ ] **Step 3: Add the two new routes**

After the existing `/dashboard/assets` route:

```tsx
<Route path="/dashboard/assets" element={<AuthGuard><DashboardAssetsPage /></AuthGuard>} />
<Route path="/dashboard/assets/new" element={<AuthGuard><DashboardAssetDetail /></AuthGuard>} />
<Route path="/dashboard/assets/:assetId" element={<AuthGuard><DashboardAssetDetail /></AuthGuard>} />
```

Important: `/dashboard/assets/new` must come **before** `/dashboard/assets/:assetId` so the literal "new" string is matched first and not treated as an ID.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(dashboard): register /dashboard/assets/new and /dashboard/assets/:assetId routes"
```

---

## Task 3: Update `DashboardAssets.tsx` — replace dialog with navigation

**Files:**
- Modify: `src/pages/DashboardAssets.tsx`

- [ ] **Step 1: Read `src/pages/DashboardAssets.tsx`**

- [ ] **Step 2: Replace the file contents**

Replace the entire file with this updated version that removes the dialog and adds navigation:

```tsx
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useCreatorProducts, useDeleteProduct } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package } from 'lucide-react';
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

export default function DashboardAssetsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const { data: assets, isLoading } = useCreatorProducts();
  const deleteProduct = useDeleteProduct();

  const handleNew = () => {
    const url = projectParam
      ? `/dashboard/assets/new?project=${encodeURIComponent(projectParam)}`
      : '/dashboard/assets/new';
    navigate(url);
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Your Assets</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Manage your Godot asset listings</p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New asset
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#f5f5f5] text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px]">
              <span>Asset</span>
              <span className="text-right">Price</span>
              <span>Status</span>
              <span></span>
            </div>

            {assets.map((asset, i) => (
              <div
                key={asset.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 ${
                  i < assets.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                }`}
              >
                {/* Asset info — clicking navigates to the detail page */}
                <Link
                  to={`/dashboard/assets/${asset.id}`}
                  className="flex items-center gap-3 min-w-0 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {asset.cover_image_url && (
                      <img
                        src={asset.cover_image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                      {asset.title}
                    </div>
                    {asset.category && (
                      <div className="text-[11px] text-[#aaa]">{asset.category}</div>
                    )}
                  </div>
                </Link>

                {/* Price */}
                <div className="text-[13px] font-bold text-right">
                  {asset.price === 0 ? 'Free' : `$${(asset.price / 100).toFixed(2)}`}
                </div>

                {/* Status */}
                <div>
                  {asset.status === 'published' ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[#aaa] border-[#e5e5e5] text-[10px]">
                      Draft
                    </Badge>
                  )}
                </div>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#777] hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{asset.title}" will be permanently removed from the marketplace. This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => deleteProduct.mutate(asset.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
            <Package className="w-10 h-10 text-[#ccc] mx-auto mb-4" />
            <p className="text-[16px] font-bold text-[#111] mb-1">No assets yet</p>
            <p className="text-[13px] text-[#888] mb-6 max-w-xs mx-auto">
              Upload your first Godot plugin, shader, or sprite pack and start selling.
            </p>
            <Button
              onClick={handleNew}
              className="bg-primary hover:bg-[#3a7aab] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload your first asset
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/DashboardAssets.tsx
git commit -m "feat(dashboard): replace asset edit dialog with navigation to /dashboard/assets/:id"
```

---

## Task 4: Push to main

- [ ] **Step 1: Pull rebase and push**

```bash
cd "C:\Users\jakey\Claude Code\fanrealms-universe-access"
git pull --rebase origin main && git push origin main
```

Expected: `main -> main` success line.

---

## Manual Smoke Tests

After Lovable deploys, verify these flows:

| Scenario | Expected |
|---|---|
| `/dashboard/assets` list — click asset title | Navigates to `/dashboard/assets/:id` with form prefilled |
| `/dashboard/assets` — click "New asset" | Navigates to `/dashboard/assets/new` with empty form |
| `/dashboard/assets/new` — fill form, save | Navigates to `/dashboard/assets/:newId` |
| `/dashboard/assets/:id` — edit title, click Save | Toast "Changes saved", title updates |
| `/dashboard/assets/:id` — toggle publish, save | Status badge updates on list page |
| `/dashboard/assets/:id` — "View public page" link | Opens `/marketplace/:id` |
| `/dashboard/assets/:id` — delete | Navigates back to `/dashboard/assets` |
| `/dashboard/assets/:id` — asset with sales | Stats sidebar shows count and earnings |
| `/dashboard/assets/bad-uuid` | "Asset not found" with back link |
