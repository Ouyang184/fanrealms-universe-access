# Direct File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain external download URL field with direct file uploads to private Supabase Storage, gated behind purchase verification for paid assets — fixing the critical `asset_url` public exposure vulnerability.

**Architecture:** Six tasks in dependency order: (1) DB migration adds `asset_file_path` column and `product-files` private bucket; (2) new `get-download-url` Edge Function verifies JWT + purchase before issuing a 1-hour signed URL; (3) `useMarketplace.ts` types updated; (4) `DashboardAssetDetail.tsx` gets a file upload UI replacing the plain URL input; (5+6) `ProductDetail.tsx` and `Library.tsx` call the Edge Function instead of opening `asset_url` directly. External URL remains as a fallback for legacy assets.

**Tech Stack:** React 18, TypeScript, Supabase Storage, Supabase Edge Functions (Deno), TanStack Query, Sonner toasts, @supabase/supabase-js

---

## File Structure

| File | Action |
|---|---|
| `supabase/migrations/20260514000000-add-asset-file-path.sql` | Create — `asset_file_path` column + `product-files` bucket |
| `supabase/functions/get-download-url/index.ts` | Create — Edge Function |
| `src/hooks/useMarketplace.ts` | Modify — add `asset_file_path` to types, regen types |
| `src/integrations/supabase/types.ts` | Modify — regen to include `asset_file_path` |
| `src/pages/DashboardAssetDetail.tsx` | Modify — file upload UI |
| `src/pages/ProductDetail.tsx` | Modify — call Edge Function |
| `src/pages/Library.tsx` | Modify — call Edge Function |

---

## Task 1: Migration — `asset_file_path` column + `product-files` bucket

**Files:**
- Create: `supabase/migrations/20260514000000-add-asset-file-path.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260514000000-add-asset-file-path.sql

-- Add asset_file_path column to store Supabase Storage paths
-- asset_url is kept for backward compat with existing external-URL assets
ALTER TABLE digital_products
  ADD COLUMN IF NOT EXISTS asset_file_path TEXT;

-- Create private product-files bucket (50 MB size limit, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-files', 'product-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__plugin_supabase_supabase__apply_migration` with:
- `project_id`: `eaeqyctjljbtcatlohky`
- `name`: `add_asset_file_path_and_product_files_bucket`
- `query`: the SQL above

- [ ] **Step 3: Verify column and bucket exist**

Use `mcp__plugin_supabase_supabase__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'digital_products' AND column_name = 'asset_file_path';

SELECT id, name, public FROM storage.buckets WHERE id = 'product-files';
```

Expected: `asset_file_path` row + `product-files` row with `public = false`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260514000000-add-asset-file-path.sql
git commit -m "feat: add asset_file_path column and product-files private storage bucket"
```

---

## Task 2: `get-download-url` Edge Function

**Files:**
- Create: `supabase/functions/get-download-url/index.ts`

- [ ] **Step 1: Create the Edge Function**

Write this exact content to `supabase/functions/get-download-url/index.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller's JWT
    const anonClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const product_id: string | undefined = body?.product_id
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseService)

    // Fetch product (service role so we always get the row regardless of RLS)
    const { data: product, error: productError } = await serviceClient
      .from('digital_products')
      .select('id, price, asset_file_path, asset_url, status')
      .eq('id', product_id)
      .maybeSingle()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (product.status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'Product not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No file in Storage — fall back to external URL
    if (!product.asset_file_path) {
      if (!product.asset_url) {
        return new Response(
          JSON.stringify({ error: 'No download available for this product' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ url: product.asset_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For paid products, verify the caller has a completed purchase
    if (Number(product.price) > 0) {
      const { data: purchase } = await serviceClient
        .from('purchases')
        .select('id')
        .eq('product_id', product_id)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle()

      if (!purchase) {
        return new Response(
          JSON.stringify({ error: 'Purchase required to download this asset' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate 1-hour signed URL using service role
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from('product-files')
      .createSignedUrl(product.asset_file_path, 3600)

    if (signedError || !signedData?.signedUrl) {
      console.error('createSignedUrl error:', signedError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url: signedData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('get-download-url error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Deploy the Edge Function via Supabase MCP**

Use `mcp__plugin_supabase_supabase__deploy_edge_function` with:
- `project_id`: `eaeqyctjljbtcatlohky`
- `name`: `get-download-url`
- `entrypoint_path`: `index.ts`
- `verify_jwt`: `false` (function validates JWT manually — same pattern as create-checkout-session)
- `files`: include both `index.ts` and `../_shared/cors.ts`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/get-download-url/index.ts
git commit -m "feat: add get-download-url edge function with purchase verification"
```

---

## Task 3: Update `useMarketplace.ts` types + regenerate Supabase types

**Files:**
- Modify: `src/hooks/useMarketplace.ts`
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Add `asset_file_path` to `useCreateProduct` mutation type**

In `src/hooks/useMarketplace.ts`, find the `mutationFn` parameter type inside `useCreateProduct`. Add `asset_file_path?: string;` after `trailer_url?: string;`:

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
      asset_file_path?: string;   // ← add this line
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

- [ ] **Step 2: Add `asset_file_path` to `useUpdateProduct` mutation type**

Find the `mutationFn` parameter type inside `useUpdateProduct`. Add `asset_file_path?: string;` after `trailer_url?: string;`:

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
      asset_file_path?: string;   // ← add this line
      screenshots?: string[];
      version?: string;
      license?: string;
      godot_version?: string;
      status?: string;
      project_id?: string | null;
    }) => {
```

- [ ] **Step 3: Regenerate Supabase TypeScript types**

Use `mcp__plugin_supabase_supabase__generate_typescript_types` with `project_id: "eaeqyctjljbtcatlohky"`. Write the result to `src/integrations/supabase/types.ts`.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: `✓ built in Xs` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMarketplace.ts src/integrations/supabase/types.ts
git commit -m "feat: add asset_file_path to mutation types, regen supabase types"
```

---

## Task 4: File upload UI in `DashboardAssetDetail.tsx`

**Files:**
- Modify: `src/pages/DashboardAssetDetail.tsx`

This task replaces the single "Download URL" text input with a two-part UI: a primary file upload button (for Supabase Storage) and a secondary external URL fallback.

- [ ] **Step 1: Add new state variables**

After the existing `const [saving, setSaving] = useState(false);` line, add:

```tsx
  const [assetFile, setAssetFile] = useState<File | null>(null);
  // Existing storage path from the DB (null = no file uploaded yet)
  const [assetFilePath, setAssetFilePath] = useState<string | null>(null);
```

- [ ] **Step 2: Load `asset_file_path` from product in the `useEffect`**

In the existing `useEffect` that populates form state from `product`, add after the `setTrailerUrl` line:

```tsx
      setAssetFilePath(p.asset_file_path ?? null);
```

- [ ] **Step 3: Add the `uploadAssetFile` helper**

Add this function after the existing `uploadCover` function:

```tsx
  const uploadAssetFile = async (productId: string): Promise<string | null> => {
    if (!assetFile || !user) return null;

    // Fetch creator ID for the storage path
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!creator) {
      toast.error('Creator profile not found');
      return null;
    }

    const path = `${creator.id}/${productId}/${assetFile.name}`;
    const { error } = await supabase.storage
      .from('product-files')
      .upload(path, assetFile, { upsert: true });

    if (error) {
      toast.error('File upload failed: ' + error.message);
      return null;
    }

    return path; // storage path, not a public URL
  };
```

- [ ] **Step 4: Update `buildPayload` to include `asset_file_path`**

In `buildPayload`, update the return object. Find `asset_url: downloadUrl.trim() || undefined,` and add `asset_file_path` handling:

```tsx
    return {
      title: title.trim(),
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      price: priceInCents,
      category,
      godot_version: godotVersion !== 'Any / Not applicable' ? godotVersion : undefined,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      // Only one download source at a time: file upload takes priority
      asset_file_path: assetFile ? undefined : (assetFilePath ?? undefined), // set after upload in doSave
      asset_url: assetFile ? undefined : (downloadUrl.trim() || undefined), // cleared when file uploaded
      trailer_url: trailerUrl.trim() || undefined,
      screenshots: screenshots.map(s => s.trim()).filter(Boolean),
      version: version.trim() || undefined,
      license,
      status: finalStatus,
    };
```

- [ ] **Step 5: Update `doSave` to handle file uploads**

Replace the existing `doSave` function body with this version that handles file uploads for both new and existing assets:

```tsx
  const doSave = async (overrideStatus?: 'draft' | 'published'): Promise<string | null> => {
    if (!title.trim()) { toast.error('Title is required'); return null; }
    const finalStatus = overrideStatus ?? status;
    const hasDownload = assetFile || assetFilePath || downloadUrl.trim();
    if (finalStatus === 'published' && !hasDownload) {
      toast.error('A download file or URL is required to publish');
      return null;
    }
    const payload = buildPayload(overrideStatus);
    if (!payload) return null;

    if (priceMode === 'name_your_price' && payload.status === 'published') {
      toast.error('"Name your price" publishing is coming soon. Please use Free or Paid to publish.');
      return null;
    }

    setSaving(true);
    try {
      let coverImageUrl = (product as any)?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (!uploaded) return null;
        coverImageUrl = uploaded;
      }

      if (isNew) {
        // Step 1: Create product without file path
        const created = await createProduct.mutateAsync({
          ...payload,
          cover_image_url: coverImageUrl ?? undefined,
          asset_file_path: undefined, // set after upload
        });
        const newId = (created as any).id;

        // Step 2: Upload file if selected, then update product
        if (assetFile) {
          const filePath = await uploadAssetFile(newId);
          if (!filePath) return null;
          await updateProduct.mutateAsync({
            id: newId,
            asset_file_path: filePath,
            asset_url: undefined, // clear external URL
          });
          setAssetFilePath(filePath);
          setAssetFile(null);
        }
        return newId;
      } else {
        // For existing assets: upload file first, then save everything together
        let finalFilePath = assetFilePath;
        if (assetFile) {
          const filePath = await uploadAssetFile(assetId!);
          if (!filePath) return null;
          finalFilePath = filePath;
          setAssetFilePath(filePath);
          setAssetFile(null);
        }

        await updateProduct.mutateAsync({
          id: assetId!,
          ...payload,
          cover_image_url: coverImageUrl ?? undefined,
          asset_file_path: finalFilePath ?? undefined,
          asset_url: finalFilePath ? undefined : (downloadUrl.trim() || undefined),
        });
        return assetId!;
      }
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  };
```

- [ ] **Step 6: Replace the Download URL field in the JSX**

Find the existing Download URL field block:

```tsx
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
```

Replace with:

```tsx
              {/* Download — file upload (primary) or external URL (fallback) */}
              <div className="space-y-3">
                <label className="text-[13px] font-semibold text-[#333] block">
                  Download file <span className="text-red-500">*</span>
                </label>

                {/* Uploaded / selected file display */}
                {(assetFilePath || assetFile) ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
                    <Package className="w-4 h-4 text-[#888] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">
                        {assetFile
                          ? `${assetFile.name} (${(assetFile.size / 1024 / 1024).toFixed(1)} MB)`
                          : assetFilePath?.split('/').pop()
                        }
                      </div>
                      {assetFilePath && !assetFile && (
                        <div className="text-[11px] text-[#aaa]">Uploaded to secure storage</div>
                      )}
                      {assetFile && (
                        <div className="text-[11px] text-[#aaa]">Will upload on save</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('asset-file-input')?.click()}
                        className="text-[12px] text-primary hover:underline font-medium"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAssetFile(null); setAssetFilePath(null); }}
                        className="text-[12px] text-red-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      id="asset-file-input"
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error('File must be smaller than 50 MB');
                          return;
                        }
                        setAssetFile(file);
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('asset-file-input')?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border border-[#e5e5e5] rounded-lg hover:bg-[#fafafa] transition-colors text-[#333]"
                    >
                      <Upload className="w-4 h-4" />
                      Upload file
                    </button>
                    <p className="text-[11px] text-[#aaa] mt-1">Max 50 MB. ZIP, PDF, or any file type.</p>
                    <input
                      id="asset-file-input"
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error('File must be smaller than 50 MB');
                          return;
                        }
                        setAssetFile(file);
                      }}
                    />
                  </div>
                )}

                {/* External URL fallback — only shown when no file is uploaded */}
                {!assetFilePath && !assetFile && (
                  <div>
                    <p className="text-[12px] text-[#888] mb-1.5">— or use an external URL —</p>
                    <Input
                      value={downloadUrl}
                      onChange={e => setDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://mega.nz/..."
                      type="url"
                    />
                    <p className="text-[11px] text-[#aaa] mt-0.5">
                      Google Drive, MEGA, Dropbox, or any direct link.
                    </p>
                  </div>
                )}
              </div>
```

Note: `Package` and `Upload` icons are already imported at the top of the file.

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/DashboardAssetDetail.tsx
git commit -m "feat: file upload UI in asset detail — direct upload to Supabase Storage"
```

---

## Task 5: Update `ProductDetail.tsx` to call the Edge Function

**Files:**
- Modify: `src/pages/ProductDetail.tsx`

Replace the `handleDownload` function that opens `asset_url` directly with one that calls `get-download-url` and shows a loading state.

- [ ] **Step 1: Add `downloading` state and update `handleDownload`**

Add `const [downloading, setDownloading] = useState(false);` after the existing `const [activeImg, setActiveImg] = useState(0);` line.

Then replace the existing `handleDownload` function:

```tsx
  const handleDownload = async () => {
    if (!productId) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { product_id: productId },
      });
      if (error || !data?.url) {
        toast.error(data?.error || 'Download unavailable. Please try again.');
        return;
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
```

- [ ] **Step 2: Update the Download button to show loading state**

Find the Download button JSX (it renders when `canDownload` is true). It currently looks like:

```tsx
<Button onClick={handleDownload} ...>
  <Download ... />
  Download
</Button>
```

Update it to disable and show a spinner when `downloading`:

```tsx
<Button onClick={handleDownload} disabled={downloading} ...>
  {downloading
    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting link…</>
    : <><Download className="h-4 w-4 mr-2" />Download</>
  }
</Button>
```

Add `Loader2` to the existing import from `lucide-react`.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProductDetail.tsx
git commit -m "feat: gate ProductDetail downloads behind get-download-url edge function"
```

---

## Task 6: Update `Library.tsx` to call the Edge Function

**Files:**
- Modify: `src/pages/Library.tsx`

The `DownloadButton` component in Library currently renders a plain `<a href={assetUrl}>`. Replace it with a button that calls `get-download-url`.

- [ ] **Step 1: Rewrite `DownloadButton` to use the Edge Function**

The current `DownloadButton` receives `assetUrl`. We need `productId` instead (to call the function). Update the component signature and implementation:

Replace the existing `DownloadButton` function (lines ~36–49):

```tsx
function DownloadButton({ productId }: { productId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-download-url', {
        body: { product_id: productId },
      });
      if (error || !data?.url) {
        toast.error(data?.error || 'Download unavailable');
        return;
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
    >
      {downloading
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Getting link…</>
        : <><ExternalLink className="w-3.5 h-3.5" />Download</>
      }
    </button>
  );
}
```

- [ ] **Step 2: Add required imports**

Add to the existing lucide-react import: `Loader2`
Add the Supabase client import: `import { supabase } from '@/integrations/supabase/client';`
Add: `import { useState } from 'react';`
Add: `import { toast } from 'sonner';`

Check if any of these are already imported — only add what's missing.

- [ ] **Step 3: Update the `DownloadButton` usage in the render**

Find where `<DownloadButton assetUrl={...} />` is called and update to pass `productId`:

Replace:
```tsx
<DownloadButton assetUrl={(p.digital_products as any)?.asset_url} />
```

With:
```tsx
<DownloadButton productId={p.product_id ?? (p.digital_products as any)?.id ?? ''} />
```

Note: `purchases` rows have a `product_id` column — check the shape of `p` from `useUserPurchases()`. The hook selects `*, digital_products(...)` so `p.product_id` should be the FK column.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Library.tsx
git commit -m "feat: gate Library downloads behind get-download-url edge function"
```

---

## Post-implementation: Push to main

```bash
git pull --rebase origin main
git push origin main
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ `product-files` private bucket: Task 1
- ✅ `asset_file_path` column: Task 1
- ✅ `get-download-url` Edge Function with purchase check: Task 2
- ✅ Free assets: generate signed URL for any authenticated user (price === 0 path in Task 2)
- ✅ Paid assets: verify purchase before URL (Task 2 lines 49–60)
- ✅ External URL fallback when `asset_file_path` is null: Task 2 lines 37–46
- ✅ Upload UI with file + "or external URL": Task 4
- ✅ Only one source at a time (file OR URL): Task 4 `buildPayload`
- ✅ Upload on save (not on file select): Task 4 `doSave`
- ✅ `useMarketplace.ts` types: Task 3
- ✅ `ProductDetail.tsx` download gated: Task 5
- ✅ `Library.tsx` download gated: Task 6
- ✅ 50 MB client-side limit: Task 4 file input `onChange`
- ✅ Signed URL TTL 3600s: Task 2

**Dependency order:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6. Each task can be committed independently and builds on the previous.

**Type consistency:** `asset_file_path` is `string | null` throughout — in types.ts, mutation types, state, and Edge Function response.
