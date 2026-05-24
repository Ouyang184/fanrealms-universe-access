import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Upload, Loader2, Package } from 'lucide-react';
import { usePublishProductVersion } from '@/hooks/useProductVersions';
import { toast } from 'sonner';

const MAX_ASSET_SIZE_MB = 500;

interface Props {
  productId: string;
  onPublished?: (newVersion: string, newFilePath: string) => void;
}

export function ReleaseVersionPanel({ productId, onPublished }: Props) {
  const [open, setOpen] = useState(false);
  const [versionNumber, setVersionNumber] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const publish = usePublishProductVersion();

  const reset = () => {
    setVersionNumber('');
    setReleaseNotes('');
    setFile(null);
  };

  const handlePublish = async () => {
    if (!versionNumber.trim()) {
      toast.error('Version number is required');
      return;
    }
    if (!file) {
      toast.error('Please choose a file');
      return;
    }
    try {
      const result = await publish.mutateAsync({
        productId,
        versionNumber,
        releaseNotes,
        file,
      });
      reset();
      setOpen(false);
      onPublished?.(result.version_number, result.file_path);
    } catch {
      // toast already shown by hook
    }
  };

  return (
    <div className="border border-[#eee] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-[#333] hover:bg-[#fafafa] transition-colors"
      >
        <span>Release a new version</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-[#888]" />
          : <ChevronRight className="w-4 h-4 text-[#888]" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-4 space-y-4 border-t border-[#eee]">
          <p className="text-[12px] text-[#888]">
            Upload a new file with a version number and notes. Buyers will get the new file on download and see the changelog on the product page.
          </p>
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
              Version number <span className="text-red-500">*</span>
            </label>
            <Input
              value={versionNumber}
              onChange={e => setVersionNumber(e.target.value)}
              placeholder="e.g. 1.1.0"
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
              Release notes
            </label>
            <Textarea
              value={releaseNotes}
              onChange={e => setReleaseNotes(e.target.value)}
              placeholder="What changed in this version?"
              rows={4}
            />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#333] block mb-1.5">
              New file <span className="text-red-500">*</span>
            </label>
            {file ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg">
                <Package className="w-4 h-4 text-[#888] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[12px] text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => document.getElementById('new-version-file-input')?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border border-[#e5e5e5] rounded-lg hover:bg-[#fafafa] transition-colors text-[#333]"
                >
                  <Upload className="w-4 h-4" />
                  Choose file
                </button>
                <p className="text-[11px] text-[#aaa] mt-1">Max {MAX_ASSET_SIZE_MB} MB.</p>
              </>
            )}
            <input
              id="new-version-file-input"
              type="file"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > MAX_ASSET_SIZE_MB * 1024 * 1024) {
                  toast.error(`File must be smaller than ${MAX_ASSET_SIZE_MB} MB`);
                  return;
                }
                setFile(f);
              }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handlePublish}
              disabled={publish.isPending}
              className="bg-primary hover:bg-[#3a7aab] text-white font-semibold"
            >
              {publish.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing…</>
                : 'Publish update'
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); setOpen(false); }}
              disabled={publish.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
