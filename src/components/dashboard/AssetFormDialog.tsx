import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const CATEGORIES = ['plugins', 'shaders', 'sprites', 'audio', 'games', 'tools'];

interface Asset {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  category?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
  asset_url?: string | null;
  status: string;
}

interface AssetFormDialogProps {
  open: boolean;
  onClose: () => void;
  asset?: Asset | null;
}

export function AssetFormDialog({ open, onClose, asset }: AssetFormDialogProps) {
  const { user } = useAuth();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = !!asset;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('0');
  const [category, setCategory] = useState('plugins');
  const [tagsStr, setTagsStr] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title);
      setDescription(asset.description ?? '');
      setPriceStr(asset.price === 0 ? '0' : (asset.price / 100).toFixed(2));
      setCategory(asset.category ?? 'plugins');
      setTagsStr((asset.tags ?? []).join(', '));
      setDownloadUrl(asset.asset_url ?? '');
      setStatus(asset.status === 'published' ? 'published' : 'draft');
      setCoverPreview(asset.cover_image_url ?? null);
    } else {
      setTitle('');
      setDescription('');
      setPriceStr('0');
      setCategory('plugins');
      setTagsStr('');
      setDownloadUrl('');
      setStatus('draft');
      setCoverFile(null);
      setCoverPreview(null);
    }
  }, [asset, open]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (error) {
      toast.error('Cover upload failed: ' + error.message);
      return null;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (status === 'published' && !downloadUrl.trim()) {
      toast.error('A download URL is required to publish');
      return;
    }

    setUploading(true);
    try {
      let coverImageUrl = asset?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) coverImageUrl = uploaded;
      }

      const priceInCents = Math.round(parseFloat(priceStr || '0') * 100);
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceInCents,
        category,
        tags,
        cover_image_url: coverImageUrl ?? undefined,
        asset_url: downloadUrl.trim() || undefined,
        status,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Asset' : 'New Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Cover image */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Cover image</label>
            <div
              className="w-full aspect-[4/3] bg-[#f5f5f5] border border-[#eee] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:bg-[#eee] transition-colors relative"
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center text-[#aaa]">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[12px]">Click to upload</span>
                </div>
              )}
              <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Godot Shader Pack Vol.1" required />
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's included? Who's it for?" rows={3} />
          </div>

          {/* Category + Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#333] block mb-1.5">Price (USD)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={priceStr}
                onChange={e => setPriceStr(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-[11px] text-[#aaa] mt-0.5">Set 0 for free</p>
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

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
              className={`relative w-10 h-5 rounded-full transition-colors ${status === 'published' ? 'bg-primary' : 'bg-[#ddd]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${status === 'published' ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-[13px] text-[#555]">
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="bg-primary hover:bg-[#3a7aab]">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : isEdit ? 'Save changes' : 'Create asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
