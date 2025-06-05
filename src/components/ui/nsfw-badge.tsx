
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NSFWBadgeProps {
  className?: string;
  variant?: "card" | "profile";
}

export function NSFWBadge({ className, variant = "card" }: NSFWBadgeProps) {
  return (
    <Badge 
      className={cn(
        "bg-red-600 hover:bg-red-700 text-white font-bold border-0",
        variant === "card" && "text-xs px-2 py-0.5",
        variant === "profile" && "text-sm px-3 py-1",
        className
      )}
    >
      18+
    </Badge>
  );
}
