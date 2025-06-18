
import { AlertTriangle } from "lucide-react";

interface NSFWNoticeProps {
  willBeNSFW: boolean;
}

export function NSFWNotice({ willBeNSFW }: NSFWNoticeProps) {
  if (!willBeNSFW) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Automatic 18+ Content Flagging</p>
          <p className="text-xs mt-1">
            Since you have 18+ content creation enabled in your settings, this post will automatically be flagged as mature content.
          </p>
        </div>
      </div>
    </div>
  );
}
