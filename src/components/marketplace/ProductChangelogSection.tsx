import { formatDistanceToNow } from 'date-fns';
import { useProductVersions } from '@/hooks/useProductVersions';
import { History } from 'lucide-react';

interface Props {
  productId: string;
}

export function ProductChangelogSection({ productId }: Props) {
  const { data: versions, isLoading } = useProductVersions(productId);

  if (isLoading) return null;
  if (!versions || versions.length <= 1) return null;

  return (
    <div className="border-t border-border pt-6 mt-6">
      <h2 className="text-[15px] font-bold text-foreground mb-4 flex items-center gap-2">
        <History className="w-4 h-4" />
        Changelog
      </h2>
      <div className="space-y-5">
        {versions.map((v) => (
          <div key={v.id} className="border-l-2 border-border pl-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-foreground">v{v.version_number}</span>
              <span className="text-[12px] text-muted-foreground">
                {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
              </span>
            </div>
            {v.release_notes && (
              <p className="text-[13px] text-foreground/80 mt-1.5 whitespace-pre-wrap leading-relaxed">
                {v.release_notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
