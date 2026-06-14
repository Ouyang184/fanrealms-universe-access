import { useCallback, useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropperDialogProps {
  open: boolean;
  file: File | null;
  aspect?: number;
  outputMaxWidth?: number;
  onCancel: () => void;
  onConfirm: (croppedFile: File, previewUrl: string) => void;
}

async function getCroppedFile(
  imageSrc: string,
  area: Area,
  fileName: string,
  outputMaxWidth: number,
): Promise<{ file: File; url: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const scale = Math.min(1, outputMaxWidth / area.width);
  const outW = Math.round(area.width * scale);
  const outH = Math.round(area.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Crop failed'))),
      'image/jpeg',
      0.9,
    ),
  );
  const base = fileName.replace(/\.[^.]+$/, '');
  const file = new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  return { file, url: URL.createObjectURL(blob) };
}

export function ImageCropperDialog({
  open,
  file,
  aspect = 16 / 9,
  outputMaxWidth = 1600,
  onCancel,
  onConfirm,
}: ImageCropperDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const handleConfirm = async () => {
    if (!src || !area || !file) return;
    setBusy(true);
    try {
      const { file: cropped, url } = await getCroppedFile(src, area, file.name, outputMaxWidth);
      onConfirm(cropped, url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop cover image (16:9)</DialogTitle>
        </DialogHeader>
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: 360 }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          )}
        </div>
        <div className="px-1">
          <label className="text-[12px] font-medium text-muted-foreground block mb-2">Zoom</label>
          <Slider
            value={[zoom]}
            min={1}
            max={4}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy || !area}>
            {busy ? 'Processing…' : 'Use this crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
