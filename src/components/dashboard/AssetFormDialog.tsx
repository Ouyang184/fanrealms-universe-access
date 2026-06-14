import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useMarketplace';
import { useCreatorProjects } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Upload, Plus, X } from 'lucide-react';
import { ImageCropperDialog } from './ImageCropperDialog';
import { ENGINES, ENGINE_VERSIONS, type Engine } from '@/lib/engines';

const CATEGORIES = [
  'Plugins & Addons',
  'Shaders',
  'Scripts & Systems',
  '2D Assets',
  '3D Assets',
  'Complete Games',
  'Templates',
  'Tools',
  'Tutorials',
  'Music & SFX',
  'Other',
];
const LICENSES = ['Standard', 'Creative Commons (CC BY)', 'Creative Commons (CC BY-SA)', 'MIT', 'Public Domain'];

interface Asset {
  id: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  category?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
  asset_url?: string | null;
  screenshots?: string[] | null;
  version?: string | null;
  license?: string | null;
  engine?: string | null;
  godot_version?: string | null;
  status: string;
  project_id?: string | null;
}

interface AssetFormDialogProps {
  open: boolean;
  onClose: () => void;
  asset?: Asset | null;
  defaultProjectId?: string | null;
}

export function AssetFormDialog({ open, onClose, asset, defaultProjectId = null }: AssetFormDialogProps) {
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { projects } = useCreatorProjects();
  const isEdit = !!asset;

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('0');
  const [category, setCategory] = useState('Plugins & Addons');
  const [tagsStr, setTagsStr] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [version, setVersion] = useState('');
  const [license, setLicense] = useState('Standard');
  const [engine, setEngine] = useState<Engine>('Godot');
  const [godotVersion, setGodotVersion] = useState<string>('Godot 4.3+');
  const [screenshots, setScreenshots] = useState<string[]>(['']);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | ''>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title);
      setShortDescription(asset.short_description ?? '');
      setDescription(asset.description ?? '');
      setPriceStr(asset.price === 0 ? '0' : (asset.price / 100).toFixed(2));
      setCategory(asset.category ?? 'Plugins & Addons');
      setTagsStr((asset.tags ?? []).join(', '));
      setDownloadUrl(asset.asset_url ?? '');
      setVersion(asset.version ?? '');
      setLicense(asset.license ?? 'Standard');
      const assetEngine: Engine = (ENGINES as readonly string[]).includes(asset.engine ?? '')
        ? (asset.engine as Engine)
        : 'Godot';
      setEngine(assetEngine);
      setGodotVersion(asset.godot_version ?? (ENGINE_VERSIONS[assetEngine][0] ?? ''));
      setScreenshots(asset.screenshots?.length ? asset.screenshots : ['']);
      setStatus(asset.status === 'published' ? 'published' : 'draft');
      setCoverPreview(asset.cover_image_url ?? null);
      setProjectId(asset.project_id ?? '');
    } else {
      setTitle(''); setShortDescription(''); setDescription('');
      setPriceStr('0'); setCategory('Plugins & Addons'); setTagsStr('');
      setDownloadUrl(''); setVersion(''); setLicense('Standard');
      setEngine('Godot');
      setGodotVersion('Godot 4.3+');
      setScreenshots(['']); setStatus('draft');
      setCoverFile(null); setCoverPreview(null);
      setProjectId(defaultProjectId ?? '');
    }
  }, [asset, open, defaultProjectId]);

  // Auto-select the only project if creator has exactly one and none chosen
  useEffect(() => {
    if (!isEdit && !projectId && projects.length === 1 && !defaultProjectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, isEdit, projectId, defaultProjectId]);


  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_COVER_SIZE_MB = 5;

  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again re-opens the cropper
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
    setPendingCropFile(file);
  };

  const handleCropConfirm = (cropped: File, url: string) => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(cropped);
    setCoverPreview(url);
    setPendingCropFile(null);
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile || !user) return null;
    const ext = coverFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, coverFile, { upsert: true });
    if (error) { toast.error('Cover upload failed: ' + error.message); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const addScreenshot = () => setScreenshots(s => [...s, '']);
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, val: string) => setScreenshots(s => s.map((v, idx) => idx === i ? val : v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (status === 'published' && !downloadUrl.trim()) { toast.error('A download URL is required to publish'); return; }

    setUploading(true);
    try {
      let coverImageUrl = asset?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) coverImageUrl = uploaded;
      }

      const priceInCents = Math.round(parseFloat(priceStr || '0') * 100);
      if (isNaN(priceInCents) || priceInCents < 0) {
        toast.error('Please enter a valid price (0 or greater)');
        setUploading(false);
        return;
      }
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      const cleanScreenshots = screenshots.map(s => s.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        price: priceInCents,
        category,
        tags,
        cover_image_url: coverImageUrl ?? undefined,
        asset_url: downloadUrl.trim() || undefined,
        screenshots: cleanScreenshots.length ? cleanScreenshots : undefined,
        version: version.trim() || undefined,
        license,
        engine,
        godot_version: godotVersion || undefined,
        status,
        project_id: projectId || null,
      };

      if (isEdit && asset) {
        await updateProduct.mutateAsync({ id: asset.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Asset' : 'New Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Cover image */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Cover image</label>
            <div
              className="w-full aspect-[16/9] bg-[#f5f5f5] border border-[#eee] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors relative"
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center text-[#aaa]">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[12px]">Click to upload cover (16:9 recommended)</span>
                </div>
              )}
              <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>
            <p className="text-[11px] text-[#888] mt-1.5">
              Recommended: 1600×900 (16:9), JPG/PNG/WebP, under {MAX_COVER_SIZE_MB}MB. Smaller images get a blurred backdrop on the featured spotlight.
            </p>
          </div>

          {/* Project */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
              Project <span className="font-normal text-[#999]">(group this asset under one of your projects)</span>
            </label>
            {projects.length === 0 ? (
              <div className="text-[12px] text-[#888] px-3 py-2 border border-dashed border-[#e5e5e5] rounded-lg">
                You have no projects yet. Create one from{' '}
                <a href="/dashboard/projects/new" className="text-primary hover:underline">Projects → Upload new project</a>{' '}
                to group your assets.
              </div>
            ) : (
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Standalone (no project) —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Godot Shader Pack Vol.1" required />
          </div>

          {/* Short description */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Tagline <span className="font-normal text-[#999]">(one line shown on listing cards)</span></label>
            <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="e.g. 20 ready-to-use shaders for Godot 4" maxLength={120} />
          </div>

          {/* Full description */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Full description <span className="font-normal text-[#999]">(shown on product page)</span></label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={"What's included?\nWho is it for?\nHow do you use it?"} rows={6} />
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
              Screenshots <span className="font-normal text-[#999]">(image URLs, shown in gallery)</span>
            </label>
            <div className="space-y-2">
              {screenshots.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={e => updateScreenshot(i, e.target.value)}
                    placeholder="https://i.imgur.com/... or any image URL"
                    type="url"
                  />
                  {screenshots.length > 1 && (
                    <button type="button" onClick={() => removeScreenshot(i)} className="p-2 text-[#aaa] hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {screenshots.length < 5 && (
                <button type="button" onClick={addScreenshot} className="flex items-center gap-1 text-[12px] text-primary hover:underline">
                  <Plus className="w-3 h-3" /> Add screenshot
                </button>
              )}
            </div>
          </div>

          {/* Category + Engine + Engine Version */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Engine</label>
              <select
                value={engine}
                onChange={e => {
                  const next = e.target.value as Engine;
                  setEngine(next);
                  setGodotVersion(ENGINE_VERSIONS[next][0] ?? '');
                }}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {ENGINES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {ENGINE_VERSIONS[engine].length > 0 && (
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">{engine} version</label>
              <select value={godotVersion} onChange={e => setGodotVersion(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Any / Not specified</option>
                {ENGINE_VERSIONS[engine].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}

          {/* Price */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Price (USD)</label>
            <Input type="number" min="0" step="0.01" value={priceStr} onChange={e => setPriceStr(e.target.value)} placeholder="0.00" className="max-w-[160px]" />
            <p className="text-[11px] text-[#aaa] mt-0.5">Set 0 for free</p>
          </div>

          {/* Version + License */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Version</label>
              <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. 1.0.0" />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">License</label>
              <select value={license} onChange={e => setLicense(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Tags</label>
            <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="godot4, shader, 2d (comma-separated)" />
          </div>

          {/* Download URL */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Download URL *</label>
            <Input value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://mega.nz/..." type="url" />
            <p className="text-[11px] text-[#aaa] mt-0.5">Google Drive, MEGA, Dropbox, or any direct link. Buyers see this only after purchase.</p>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
              className={`relative w-10 h-5 rounded-full transition-colors ${status === 'published' ? 'bg-primary' : 'bg-[#ddd]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${status === 'published' ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-[13px] text-[#555]">{status === 'published' ? 'Published — visible to everyone' : 'Draft — only you can see it'}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>Cancel</Button>
            <Button type="submit" disabled={uploading} className="bg-primary hover:bg-[#3a7aab]">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save changes' : 'Create asset'}
            </Button>
          </DialogFooter>
        </form>
        <ImageCropperDialog
          open={!!pendingCropFile}
          file={pendingCropFile}
          aspect={16 / 9}
          onCancel={() => setPendingCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}
