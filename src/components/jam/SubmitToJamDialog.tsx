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
import { useCreatorProducts } from '@/hooks/useMarketplace';
import { useSubmitToJam } from '@/hooks/useJam';

interface Props {
  jamId: string;
  open: boolean;
  onClose: () => void;
}

export function SubmitToJamDialog({ jamId, open, onClose }: Props) {
  const { data: products, isLoading } = useCreatorProducts();
  const submitToJam = useSubmitToJam();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const published = (products ?? []).filter((p: any) => p.status === 'published');

  const handleSubmit = async () => {
    if (!selectedId) return;
    await submitToJam.mutateAsync({ jamId, productId: selectedId });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your entry</DialogTitle>
          <DialogDescription>
            Choose one of your published assets to enter in the jam.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-[13px] text-[#888] py-4">Loading your assets…</p>
        ) : published.length === 0 ? (
          <div className="py-4 space-y-2">
            <p className="text-[13px] text-[#555]">
              You have no published assets. Upload and publish one first.
            </p>
            <a
              href="/dashboard/assets/new"
              className="text-[13px] text-primary hover:underline"
            >
              Upload an asset →
            </a>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto py-2">
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
                  <img
                    src={p.cover_image_url}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
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
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || submitToJam.isPending}
            className="flex-1"
          >
            {submitToJam.isPending ? 'Submitting…' : 'Submit entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
