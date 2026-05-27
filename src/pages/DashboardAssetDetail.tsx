import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  useCreatorProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSellerSales,
} from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichDescriptionEditor } from '@/components/editor/RichDescriptionEditor';
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
import { ArrowLeft, Upload, Plus, X, Loader2, ExternalLink, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { ReleaseVersionPanel } from '@/components/marketplace/ReleaseVersionPanel';
import { useCreatorProjects } from '@/hooks/useProjects';

const CATEGORIES = [
  'Plugins & Addons', 'Shaders', 'Scripts & Systems', '2D Assets', '3D Assets',
  'Complete Games', 'Templates', 'Tools', 'Tutorials', 'Music & SFX', 'Other',
];
const GODOT_VERSIONS = ['Godot 4.3+', 'Godot 4.2', 'Godot 4.1', 'Godot 4.0', 'Godot 3.x', 'Any / Not applicable'];
const LICENSES = ['Standard', 'Creative Commons (CC BY)', 'Creative Commons (CC BY-SA)', 'MIT', 'Public Domain'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_COVER_SIZE_MB = 5;
const MAX_ASSET_SIZE_MB = 500;

type PriceMode = 'free' | 'paid' | 'name_your_price';

export default function DashboardAssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = assetId === 'new';
  // Pre-select project when arriving from /dashboard/projects/:id → "New asset"
  const preselectedProjectId = isNew ? (searchParams.get('project') ?? null) : null;

  // useCreatorProduct calls get_creator_product() RPC (SECURITY DEFINER) which
  // returns the full row including asset_url / asset_file_path for the product owner.
  const { data: product, isLoading: productLoading } = useCreatorProduct(isNew ? '' : assetId ?? '');
  const { data: salesData } = useSellerSales();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const { projects: creatorProjects } = useCreatorProjects();

  const assetSales = (salesData?.sales ?? []).filter((s: any) => s.product_id === assetId);
  const assetGross = assetSales.reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0);
  const assetNet = assetSales.reduce((sum: number, s: any) => sum + (s.net_amount ?? 0), 0);
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Form state
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(preselectedProjectId);
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
  const [assetFile, setAssetFile] = useState<File | null>(null);
  // Existing storage path from the DB (null = no file uploaded yet)
  const [assetFilePath, setAssetFilePath] = useState<string | null>(null);

  // Revoke object URL when coverPreview changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (product && !isNew) {
      const p = product as any;
      setTitle(p.title ?? '');
      setShortDescription(p.short_description ?? '');
      setDescription(p.description ?? '');
      const price = p.price ?? 0;
      if (price > 0) {
        setPriceMode('paid');
        setPriceStr(Number(price).toFixed(2));
      } else {
        setPriceMode('free');
        setPriceStr('');
      }
      setCategory(p.category ?? 'Plugins & Addons');
      setGodotVersion(p.godot_version ?? 'Godot 4.3+');
      setTagsStr((p.tags ?? []).join(', '));
      setDownloadUrl(p.asset_url ?? '');
      setAssetFilePath(p.asset_file_path ?? null);
      setTrailerUrl(p.trailer_url ?? '');
      setVersion(p.version ?? '');
      setLicense(p.license ?? 'Standard');
      setScreenshots(p.screenshots?.length ? p.screenshots : ['']);
      setStatus(p.status === 'published' ? 'published' : 'draft');
      setCoverPreview(p.cover_image_url ?? null);
      setProjectId(p.project_id ?? null);
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

  const addScreenshot = () => setScreenshots(s => [...s, '']);
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, val: string) =>
    setScreenshots(s => s.map((v, idx) => (idx === i ? val : v)));

  const buildPayload = (overrideStatus?: 'draft' | 'published') => {
    const finalStatus = overrideStatus ?? status;
    let priceDollars = 0;
    if (priceMode === 'paid') {
      priceDollars = parseFloat(priceStr || '0');
      if (isNaN(priceDollars) || priceDollars <= 0) {
        toast.error('Please enter a valid price greater than $0');
        return null;
      }
    }
    return {
      title: title.trim(),
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      price: priceDollars,
      pricing_model: priceMode,
      category,
      godot_version: godotVersion !== 'Any / Not applicable' ? godotVersion : undefined,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      project_id: projectId ?? undefined,
      // Only one download source at a time: file upload takes priority
      asset_file_path: assetFile ? undefined : (assetFilePath ?? undefined), // set after upload in doSave
      asset_url: assetFile ? undefined : (downloadUrl.trim() || undefined), // cleared when file uploaded
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
    const hasDownload = assetFile || assetFilePath || downloadUrl.trim();
    if (finalStatus === 'published' && !hasDownload) {
      toast.error('A download file or URL is required to publish');
      return null;
    }
    const payload = buildPayload(overrideStatus);
    if (!payload) return null;

    setSaving(true);
    try {
      let coverImageUrl = (product as any)?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (!uploaded) return null; // uploadCover already showed error toast
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
          if (!filePath) {
            // Clean up the orphaned product row so the creator isn't left
            // with an invisible draft they can't find.
            await deleteProduct.mutateAsync(newId).catch(() => {});
            return null;
          }
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
          // Pass null explicitly when file was removed so DB column is cleared
          asset_file_path: finalFilePath,
          asset_url: finalFilePath ? undefined : (downloadUrl.trim() || undefined),
        });
        return assetId!;
      }
    } catch (err: any) {
      // Mutation onError handlers show toasts for DB/network errors.
      // This fallback catches anything not handled upstream.
      if (err?.message && !err.message.includes('Failed to')) {
        toast.error('Save failed: ' + err.message);
      }
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
                        if (file.size > MAX_ASSET_SIZE_MB * 1024 * 1024) {
                          toast.error(`File must be smaller than ${MAX_ASSET_SIZE_MB} MB`);
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
                    <p className="text-[11px] text-[#aaa] mt-1">Max 500 MB. ZIP, PDF, or any file type.</p>
                    <input
                      id="asset-file-input"
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > MAX_ASSET_SIZE_MB * 1024 * 1024) {
                          toast.error(`File must be smaller than ${MAX_ASSET_SIZE_MB} MB`);
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

              {/* Release a new version — only for existing assets */}
              {!isNew && assetId && (
                <ReleaseVersionPanel
                  productId={assetId}
                  onPublished={(newVersion, newFilePath) => {
                    setVersion(newVersion);
                    setAssetFilePath(newFilePath);
                  }}
                />
              )}


              <div>
                <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
                  Full description{' '}
                  <span className="font-normal text-[#999]">(shown on product page)</span>
                </label>
                <RichDescriptionEditor
                  value={description}
                  onChange={setDescription}
                  placeholder={"What's included?\nWho is it for?\nHow do you use it?"}
                  rows={8}
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
                    : isNew ? 'Create asset' : status === 'published' ? 'Save & view page' : 'Save changes'
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

              {/* Project association */}
              {creatorProjects.length > 0 && (
                <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Project</h3>
                  <select
                    value={projectId ?? ''}
                    onChange={e => setProjectId(e.target.value || null)}
                    className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">— No project —</option>
                    {creatorProjects.map(p => (
                      <option key={p.id} value={p.id}>{(p as any).title}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#aaa]">Link this asset to one of your projects</p>
                </div>
              )}

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
