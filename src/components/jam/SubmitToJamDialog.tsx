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

type Tab = 'fanrealms' | 'external';

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

  // Game jams are always external; asset jams default to external but offer FanRealms tab
  const [tab, setTab] = useState<Tab>('external');

  // FanRealms tab state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // External tab state
  const [extTitle, setExtTitle] = useState('');
  const [extUrl, setExtUrl] = useState('');
  const [extCoverUrl, setExtCoverUrl] = useState('');
  const [extDescription, setExtDescription] = useState('');
  const [urlError, setUrlError] = useState('');

  const published = (products ?? []).filter((p: any) => p.status === 'published');

  const handleClose = () => {
    setSelectedId(null);
    setExtTitle('');
    setExtUrl('');
    setExtCoverUrl('');
    setExtDescription('');
    setUrlError('');
    onClose();
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSubmit = async () => {
    if (tab === 'fanrealms') {
      if (!selectedId) return;
      try {
        await submitToJam.mutateAsync({ jamId, productId: selectedId });
        handleClose();
      } catch {
        // onError toast already shown by useSubmitToJam
      }
    } else {
      if (!extTitle.trim()) return;
      if (!isValidUrl(extUrl.trim())) {
        setUrlError('Please enter a valid URL (e.g. https://yourname.itch.io/asset)');
        return;
      }
      if (extCoverUrl.trim() && !isValidUrl(extCoverUrl.trim())) {
        setUrlError('Cover image URL is not a valid URL');
        return;
      }
      setUrlError('');
      try {
        await submitToJam.mutateAsync({
          jamId,
          externalTitle: extTitle.trim(),
          externalUrl: extUrl.trim(),
          externalCoverUrl: extCoverUrl.trim() || null,
          externalDescription: extDescription.trim() || null,
        });
        handleClose();
      } catch {
        // onError toast already shown
      }
    }
  };

  const canSubmit = tab === 'fanrealms'
    ? !!selectedId
    : !!extTitle.trim() && !!extUrl.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your entry</DialogTitle>
          <DialogDescription>
            {isGame
              ? 'Submit your Godot game — hosted anywhere (itch.io, GitHub, etc.)'
              : 'Submit any original 2D game asset — hosted anywhere.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher — hidden for game jams (external only) */}
        {!isGame && (
          <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-[13px] font-semibold">
            <button
              type="button"
              onClick={() => setTab('external')}
              className={`flex-1 py-2 transition-colors ${
                tab === 'external'
                  ? 'bg-primary text-white'
                  : 'text-[#666] hover:bg-[#fafafa]'
              }`}
            >
              External (itch.io, GitHub…)
            </button>
            <button
              type="button"
              onClick={() => setTab('fanrealms')}
              className={`flex-1 py-2 transition-colors border-l border-[#e5e5e5] ${
                tab === 'fanrealms'
                  ? 'bg-primary text-white'
                  : 'text-[#666] hover:bg-[#fafafa]'
              }`}
            >
              My FanRealms Asset
            </button>
          </div>
        )}

        {/* External tab (always shown for game jams; shown when tab=external for asset jams) */}
        {(tab === 'external' || isGame) && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                {isGame ? 'Game name' : 'Asset title'} <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={isGame ? 'e.g. Dungeon Crawler' : 'e.g. Pixel Dungeon Tileset'}
                value={extTitle}
                onChange={(e) => setExtTitle(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                {isGame ? 'Game URL' : 'Asset URL'} <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={isGame ? 'https://yourname.itch.io/your-game' : 'https://yourname.itch.io/asset'}
                value={extUrl}
                onChange={(e) => { setExtUrl(e.target.value); setUrlError(''); }}
              />
              <p className="text-[11px] text-[#888]">
                {isGame
                  ? 'itch.io page with a playable or downloadable build'
                  : 'itch.io, GitHub, Unity Asset Store, GameDev Market — any public URL'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                {isGame ? 'Screenshot URL' : 'Preview image URL'}{' '}
                <span className="text-[#bbb] font-normal">(optional)</span>
              </label>
              <Input
                placeholder={isGame ? 'https://img.itch.zone/…/screenshot.png' : 'https://img.itch.zone/…/cover.png'}
                value={extCoverUrl}
                onChange={(e) => { setExtCoverUrl(e.target.value); setUrlError(''); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#555]">
                Short description <span className="text-[#bbb] font-normal">(optional)</span>
              </label>
              <Input
                placeholder={isGame ? 'What is your game about?' : 'A quick summary of your asset'}
                value={extDescription}
                onChange={(e) => setExtDescription(e.target.value)}
                maxLength={200}
              />
            </div>
            {urlError && (
              <p className="text-[12px] text-red-500">{urlError}</p>
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
                You have no published assets on FanRealms. Upload one first, or switch to the External tab.
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
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
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
