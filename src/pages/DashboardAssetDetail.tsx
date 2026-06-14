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
import { ArrowLeft, Upload, X, Loader2, ExternalLink, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { ReleaseVersionPanel } from '@/components/marketplace/ReleaseVersionPanel';
import { useCreatorProjects } from '@/hooks/useProjects';
import { ImageCropperDialog } from '@/components/dashboard/ImageCropperDialog';

const CATEGORIES = [
  'Plugins & Addons', 'Shaders', 'Scripts & Systems', '2D Assets', '3D Assets',
  'Complete Games', 'Templates', 'Tools', 'Tutorials', 'Music & SFX', 'Other',
];
const GODOT_VERSIONS = ['Any / Not applicable', 'Godot 4.3+', 'Godot 4.2', 'Godot 4.1', 'Godot 4.0', 'Godot 3.x'];
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
  const [salePriceStr, setSalePriceStr] = useState('');
  const [category, setCategory] = useState('Plugins & Addons');
  const [godotVersion, setGodotVersion] = useState('Any / Not applicable');
  const [tagsStr, setTagsStr] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [version, setVersion] = useState('');
  const [license, setLicense] = useState('Standard');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploadingShot, setUploadingShot] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // Page customization
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string>('');
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
    return () => {
      if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

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
      setScreenshots(p.screenshots ?? []);
      setStatus(p.status === 'published' ? 'published' : 'draft');
      setSalePriceStr(p.sale_price != null ? Number(p.sale_price).toFixed(2) : '');
      setCoverPreview(p.cover_image_url ?? null);
      setBannerPreview(p.banner_image_url ?? null);
      setAccentColor(p.accent_color ?? '');
      setProjectId(p.project_id ?? null);
    }
  }, [product, isNew]);

  const [pendingCoverCrop, setPendingCoverCrop] = useState<File | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Cover must be a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
      toast.error(`Cover image must be smaller than ${MAX_COVER_SIZE_MB}MB`);
      return;
    }
    setPendingCoverCrop(file);
  };

  const handleCoverCropConfirm = (cropped: File, url: string) => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(cropped);
    setCoverPreview(url);
    setPendingCoverCrop(null);
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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Banner must be a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
      toast.error(`Banner image must be smaller than ${MAX_COVER_SIZE_MB}MB`);
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile || !user) return null;
    const ext = bannerFile.name.split('.').pop();
    const path = `${user.id}/banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, bannerFile, { upsert: true });
    if (error) { toast.error('Banner upload failed: ' + error.message); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  // Validate a hex color (#rgb or #rrggbb) to avoid injecting arbitrary CSS
  const isValidHex = (c: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.trim());

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

  const MAX_SCREENSHOTS = 8;
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    const room = MAX_SCREENSHOTS - screenshots.length;
    if (room <= 0) { toast.error(`You can add up to ${MAX_SCREENSHOTS} screenshots`); return; }
    const toUpload = files.slice(0, room);
    setUploadingShot(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error(`${file.name}: must be a JPEG, PNG, WebP, or GIF image`);
          continue;
        }
        if (file.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: must be smaller than ${MAX_COVER_SIZE_MB}MB`);
          continue;
        }
        const ext = file.name.split('.').pop();
        const path = `${user.id}/shot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
        if (error) { toast.error('Screenshot upload failed: ' + error.message); continue; }
        uploaded.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
      }
      if (uploaded.length) setScreenshots(s => [...s, ...uploaded]);
    } finally {
      setUploadingShot(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

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
      sale_price: (priceMode === 'paid' && salePriceStr && parseFloat(salePriceStr) > 0 && parseFloat(salePriceStr) < parseFloat(priceStr || '0'))
        ? parseFloat(salePriceStr)
        : null,
      // Page customization (banner_image_url set after upload in doSave)
      accent_color: accentColor.trim() && isValidHex(accentColor) ? accentColor.trim().toLowerCase() : null,
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

      let bannerImageUrl = (product as any)?.banner_image_url ?? bannerPreview ?? null;
      if (bannerFile) {
        const uploaded = await uploadBanner();
        if (!uploaded) return null; // uploadBanner already showed error toast
        bannerImageUrl = uploaded;
      }

      if (isNew) {
        // Step 1: Create product without file path
        const created = await createProduct.mutateAsync({
          ...payload,
          cover_image_url: coverImageUrl ?? undefined,
          banner_image_url: bannerImageUrl ?? undefined,
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
          banner_image_url: bannerImageUrl ?? null,
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
                  <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Engine</label>
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

                  {/* Sale price — only shown for paid assets */}
                  {priceMode === 'paid' && (
                    <div className="ml-6 mt-1 flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-amber-600">Sale price</span>
                      <span className="text-[12px] text-[#555]">$</span>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={salePriceStr}
                        onChange={e => setSalePriceStr(e.target.value)}
                        placeholder="Leave blank for no sale"
                        className="w-40 h-7 text-[13px]"
                      />
                      {salePriceStr && parseFloat(salePriceStr) < parseFloat(priceStr || '0') && (
                        <span className="text-[11px] text-green-600 font-semibold">
                          {Math.round((1 - parseFloat(salePriceStr) / parseFloat(priceStr)) * 100)}% off
                        </span>
                      )}
                      {salePriceStr && parseFloat(salePriceStr) >= parseFloat(priceStr || '0') && (
                        <span className="text-[11px] text-red-500">Must be less than full price</span>
                      )}
                      <p className="text-[11px] text-[#aaa]">Clear to end sale</p>
                    </div>
                  )}

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
                      <span className="text-[11px]">Click to upload (any size)</span>
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
                <p className="text-[11px] text-[#aaa]">Shown on listing cards. Any size works — reuse your itch.io/Unity art.</p>
              </div>

              {/* Page customization — banner + accent color */}
              <div className="bg-white border border-[#eee] rounded-xl p-4 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">Page banner</h3>
                <div
                  className="w-full aspect-[3/1] bg-[#f5f5f5] border border-[#eee] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors relative"
                  onClick={() => document.getElementById('banner-input-page')?.click()}
                  style={!bannerPreview && accentColor && isValidHex(accentColor) ? { backgroundColor: accentColor } : undefined}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center text-[#aaa] p-4">
                      <Upload className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-[11px]">Wide header shown atop your page</span>
                    </div>
                  )}
                  <input
                    id="banner-input-page"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </div>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Remove banner
                  </button>
                )}

                <div className="pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa] block mb-1.5">Accent color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={isValidHex(accentColor) ? accentColor : '#4a90d9'}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded border border-[#e5e5e5] cursor-pointer bg-white p-0.5"
                    />
                    <Input
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      placeholder="#4a90d9"
                      className="flex-1 h-9 text-[13px]"
                    />
                    {accentColor && (
                      <button type="button" onClick={() => setAccentColor('')} className="text-[11px] text-[#aaa] hover:text-red-500">Clear</button>
                    )}
                  </div>
                  {accentColor && !isValidHex(accentColor) && (
                    <p className="text-[11px] text-red-500 mt-1">Use a hex color like #4a90d9</p>
                  )}
                  <p className="text-[11px] text-[#aaa] mt-1">Tints your page header and highlights</p>
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
                <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#aaa]">
                  Screenshots <span className="text-[#ccc] font-normal">{screenshots.length}/{MAX_SCREENSHOTS}</span>
                </h3>
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {screenshots.map((url, i) => (
                      <div key={i} className="relative group aspect-video bg-[#f5f5f5] border border-[#eee] rounded-lg overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/55 text-white hover:bg-red-500 transition-colors"
                          aria-label="Remove screenshot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {screenshots.length < MAX_SCREENSHOTS && (
                  <label className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-[#ddd] rounded-lg text-[12px] text-[#888] hover:border-primary hover:text-primary cursor-pointer transition-colors">
                    {uploadingShot ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload screenshots</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingShot}
                      onChange={handleScreenshotUpload}
                    />
                  </label>
                )}
                <p className="text-[11px] text-[#aaa]">Any size works. JPEG, PNG, WebP, or GIF.</p>
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
