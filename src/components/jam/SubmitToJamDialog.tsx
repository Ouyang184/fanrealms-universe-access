// src/components/jam/SubmitToJamDialog.tsx
import { useState } from 'react';
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

type Tab = 'fanrealms' | 'link';

// Domains we trust enough to render as clickable links
export const TRUSTED_DOMAINS = [
  'itch.io', 'github.com', 'github.io', 'godotengine.org',
  'gamedevmarket.net', 'unity.com', 'assetstore.unity.com',
  'opengameart.org', 'kenney.nl', 'gitlab.com', 'ldjam.com', 'gamejolt.com',
];

interface Props {
  jamId: string;
  jamType?: 'asset' | 'game';
  open: boolean;
  onClose: () => void;
}

export function SubmitToJamDialog({ jamId, jamType = 'asset', open, onClose }: Props) {
  const { data: products, isLoading } = useCreatorProducts();
  const submitToJam = useSubmitToJam();
  const isGame = jamType === 'game';

  const [tab, setTab] = useState<Tab>('fanrealms');

  // FanRealms tab
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Link tab
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCoverUrl, setLinkCoverUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkError, setLinkError] = useState('');

  const published = (products ?? []).filter((p: any) => p.status === 'published');

  const handleClose = () => {
    setSelectedId(null);
    setLinkTitle('');
    setLinkUrl('');
    setLinkCoverUrl('');
    setLinkDescription('');
    setLinkError('');
    onClose();
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const isTrustedUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch { return false; }
  };

  const handleSubmit = async () => {
    if (tab === 'fanrealms') {
      if (!selectedId) return;
      try {
        await submitToJam.mutateAsync({ jamId, productId: selectedId });
        handleClose();
      } catch { /* toast shown by hook */ }
    } else {
      if (!linkTitle.trim()) { setLinkError('Please enter a title.'); return; }
      if (!isValidUrl(linkUrl.trim())) { setLinkError('Please enter a valid URL.'); return; }
      if (!isTrustedUrl(linkUrl.trim())) {
        setLinkError(
          `For safety, only links from trusted platforms are allowed: ${TRUSTED_DOMAINS.join(', ')}.`
        );
        return;
      }
      if (linkCoverUrl.trim() && !isValidUrl(linkCoverUrl.trim())) {
        setLinkError('Preview image URL is not a valid URL.');
        return;
      }
      setLinkError('');
      try {
        await submitToJam.mutateAsync({
          jamId,
          externalTitle: linkTitle.trim(),
          externalUrl: linkUrl.trim(),
          externalCoverUrl: linkCoverUrl.trim() || null,
          externalDescription: linkDescription.trim() || null,
        });
        handleClose();
      } catch { /* toast shown by hook */ }
    }
  };

  const canSubmit = tab === 'fanrealms'
    ? !!selectedId
    : !!linkTitle.trim() && !!linkUrl.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your entry</DialogTitle>
          <DialogDescription>
            {isGame
              ? 'Submit your Godot game — upload it to FanRealms or link from itch.io.'
              : 'Submit your 2D game asset pack — upload to FanRealms or link from itch.io, GitHub, or any platform.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => setTab('fanrealms')}
            className={`flex-1 py-2 transition-colors ${
              tab === 'fanrealms' ? 'bg-primary text-white' : 'text-[#666] hover:bg-[#fafafa]'
            }`}
          >
            Upload to FanRealms
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`flex-1 py-2 transition-colors border-l border-[#e5e5e5] ${
              tab === 'link' ? 'bg-primary text-white' : 'text-[#666] hover:bg-[#fafafa]'
            }`}
          >
            Submit a link
          </button>
        </div>

        {/* FanRealms tab */}
        {tab === 'fanrealms' && (
          isLoading ? (
            <p className="text-[13px] text-[#888] py-4">Loading your assets…</p>
          ) : published.length === 0 ? (
            <div className="py-4 space-y-3">
              <p className="text-[13px] text-[#555]">
                You don't have any published assets on FanRealms yet.
              </p>
              <a
                href="/dashboard/assets/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
              >
                Upload your asset to FanRealms →
              </a>
              <p className="text-[12px] text-[#aaa]">
                Once published, come back here and it will appear in this list.
              </p>
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

        {/* Link tab */}
        {tab === 'link' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={isGame ? 'e.g. Dungeon Crawler' : 'e.g. Pixel Dungeon Tileset'}
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Link <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={isGame ? 'https://yourname.itch.io/your-game' : 'https://yourname.itch.io/your-asset'}
                value={linkUrl}
                onChange={e => { setLinkUrl(e.target.value); setLinkError(''); }}
              />
              <p className="text-[11px] text-[#888]">
                Accepted: {TRUSTED_DOMAINS.join(', ')}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Preview image URL{' '}
                <span className="text-[#bbb] font-normal">(optional)</span>
              </label>
              <Input
                placeholder="https://img.itch.zone/…/cover.png"
                value={linkCoverUrl}
                onChange={e => { setLinkCoverUrl(e.target.value); setLinkError(''); }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Short description{' '}
                <span className="text-[#bbb] font-normal">(optional)</span>
              </label>
              <Input
                placeholder={isGame ? 'What is your game about?' : "What's included?"}
                value={linkDescription}
                onChange={e => setLinkDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            {linkError && (
              <p className="text-[12px] text-red-500">{linkError}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitToJam.isPending}
            className="flex-1"
          >
            {submitToJam.isPending ? 'Submitting…' : 'Submit entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
