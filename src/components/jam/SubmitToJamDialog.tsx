// src/components/jam/SubmitToJamDialog.tsx
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreatorProducts } from '@/hooks/useMarketplace';
import { useSubmitToJam } from '@/hooks/useJam';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Upload, X, FileArchive, ImageIcon } from 'lucide-react';

type Tab = 'upload' | 'fanrealms';

const ACCEPTED_ASSET = '.zip,.png,.jpg,.jpeg,.gif,.webp';
const ACCEPTED_IMAGE = '.png,.jpg,.jpeg,.gif,.webp';
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

interface Props {
  jamId: string;
  jamType?: 'asset' | 'game';
  open: boolean;
  onClose: () => void;
}

export function SubmitToJamDialog({ jamId, jamType = 'asset', open, onClose }: Props) {
  const { data: products, isLoading } = useCreatorProducts();
  const submitToJam = useSubmitToJam();
  const { user } = useAuth();
  const isGame = jamType === 'game';

  const [tab, setTab] = useState<Tab>('upload');

  // Upload tab state
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // FanRealms tab state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assetInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const published = (products ?? []).filter((p: any) => p.status === 'published');
  const assetIsImage = assetFile && IMAGE_TYPES.includes(assetFile.type);

  const handleClose = () => {
    setAssetFile(null);
    setCoverFile(null);
    setTitle('');
    setDescription('');
    setUploadError('');
    setSelectedId(null);
    onClose();
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('jam-entries')
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from('jam-entries').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUploadSubmit = async () => {
    setUploadError('');

    if (!assetFile) { setUploadError('Please select a file to upload.'); return; }
    if (!title.trim()) { setUploadError('Please enter a title.'); return; }
    if (assetFile.size > MAX_BYTES) { setUploadError('File must be under 50 MB.'); return; }
    if (coverFile && coverFile.size > 10 * 1024 * 1024) { setUploadError('Preview image must be under 10 MB.'); return; }

    setUploading(true);
    try {
      const base = `${jamId}/${user!.id}`;
      const assetPath = `${base}/${assetFile.name}`;
      const assetUrl = await uploadFile(assetFile, assetPath);

      let coverUrl: string | null = null;
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, `${base}/cover_${coverFile.name}`);
      } else if (assetIsImage) {
        coverUrl = assetUrl; // image IS the preview
      }

      await submitToJam.mutateAsync({
        jamId,
        externalTitle: title.trim(),
        externalUrl: assetUrl,
        externalCoverUrl: coverUrl,
        externalDescription: description.trim() || null,
      });
      handleClose();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFanRealmsSubmit = async () => {
    if (!selectedId) return;
    try {
      await submitToJam.mutateAsync({ jamId, productId: selectedId });
      handleClose();
    } catch {
      // onError toast already shown
    }
  };

  const canSubmit = tab === 'upload'
    ? !!assetFile && !!title.trim()
    : !!selectedId;

  const isPending = uploading || submitToJam.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your entry</DialogTitle>
          <DialogDescription>
            {isGame
              ? 'Upload your Godot game or pick an existing FanRealms asset.'
              : 'Upload your 2D game asset directly — any engine, any format.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 transition-colors ${
              tab === 'upload' ? 'bg-primary text-white' : 'text-[#666] hover:bg-[#fafafa]'
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setTab('fanrealms')}
            className={`flex-1 py-2 transition-colors border-l border-[#e5e5e5] ${
              tab === 'fanrealms' ? 'bg-primary text-white' : 'text-[#666] hover:bg-[#fafafa]'
            }`}
          >
            My FanRealms Asset
          </button>
        </div>

        {/* Upload tab */}
        {tab === 'upload' && (
          <div className="space-y-3">
            {/* Asset file picker */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                {isGame ? 'Game file' : 'Asset file'}{' '}
                <span className="text-red-400">*</span>
                <span className="text-[#bbb] font-normal ml-1">· max 50 MB</span>
              </label>
              {assetFile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eee] bg-[#fafafa]">
                  {assetIsImage
                    ? <ImageIcon className="w-4 h-4 text-[#888] flex-shrink-0" />
                    : <FileArchive className="w-4 h-4 text-[#888] flex-shrink-0" />}
                  <span className="text-[13px] text-[#444] truncate flex-1">{assetFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAssetFile(null)}
                    className="text-[#aaa] hover:text-[#555] flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => assetInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-[#ddd] hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#aaa]" />
                  <span className="text-[12px] text-[#888]">
                    Click to upload · ZIP, PNG, JPG, GIF, WebP
                  </span>
                </button>
              )}
              <input
                ref={assetInputRef}
                type="file"
                accept={ACCEPTED_ASSET}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setAssetFile(f); setUploadError(''); }
                  e.target.value = '';
                }}
              />
            </div>

            {/* Cover image — only shown if main file is a zip */}
            {assetFile && !assetIsImage && (
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#555]">
                  Preview image{' '}
                  <span className="text-[#bbb] font-normal">(optional)</span>
                </label>
                {coverFile ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eee] bg-[#fafafa]">
                    <ImageIcon className="w-4 h-4 text-[#888] flex-shrink-0" />
                    <span className="text-[13px] text-[#444] truncate flex-1">{coverFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setCoverFile(null)}
                      className="text-[#aaa] hover:text-[#555] flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#ddd] hover:border-primary hover:bg-primary/5 transition-colors text-[12px] text-[#888]"
                  >
                    <Upload className="w-4 h-4" /> Upload a screenshot or preview
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setCoverFile(f); setUploadError(''); }
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={isGame ? 'e.g. Dungeon Crawler' : 'e.g. Pixel Dungeon Tileset'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Short description{' '}
                <span className="text-[#bbb] font-normal">(optional)</span>
              </label>
              <Input
                placeholder="What's included? What engine?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            {uploadError && (
              <p className="text-[12px] text-red-500">{uploadError}</p>
            )}
          </div>
        )}

        {/* FanRealms tab */}
        {tab === 'fanrealms' && (
          isLoading ? (
            <p className="text-[13px] text-[#888] py-4">Loading your assets…</p>
          ) : published.length === 0 ? (
            <div className="py-4 space-y-2">
              <p className="text-[13px] text-[#555]">
                No published assets yet. Upload one first or use the Upload file tab.
              </p>
              <a href="/dashboard/assets/new" className="text-[13px] text-primary hover:underline">
                Upload an asset →
              </a>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto py-1">
              {published.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    selectedId === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-[#eee] hover:border-[#ddd] hover:bg-[#fafafa]'
                  }`}
                >
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#f0f0f0] flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{p.title}</div>
                    <div className="text-[11px] text-[#888]">{p.category}</div>
                  </div>
                  {selectedId === p.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={tab === 'upload' ? handleUploadSubmit : handleFanRealmsSubmit}
            disabled={!canSubmit || isPending}
            className="flex-1"
          >
            {isPending ? 'Uploading…' : 'Submit entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
