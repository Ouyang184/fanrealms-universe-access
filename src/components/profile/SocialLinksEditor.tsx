import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SocialLinkDraft {
  label: string;
  url: string;
}

interface Props {
  links: SocialLinkDraft[];
  onChange: (links: SocialLinkDraft[]) => void;
  disabled?: boolean;
  max?: number;
}

export function SocialLinksEditor({ links, onChange, disabled, max = 10 }: Props) {
  const update = (i: number, field: keyof SocialLinkDraft, value: string) => {
    const next = [...links];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  const add = () => onChange([...links, { label: "", url: "" }]);
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {links.length === 0 && (
        <p className="text-xs text-muted-foreground">No links added yet.</p>
      )}
      {links.map((link, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor={`sl-label-${i}`} className="text-xs">Label</Label>
            <Input
              id={`sl-label-${i}`}
              placeholder="Twitter"
              value={link.label}
              maxLength={60}
              disabled={disabled}
              onChange={(e) => update(i, "label", e.target.value)}
            />
          </div>
          <div className="flex-[2]">
            <Label htmlFor={`sl-url-${i}`} className="text-xs">URL</Label>
            <Input
              id={`sl-url-${i}`}
              placeholder="https://"
              value={link.url}
              maxLength={500}
              disabled={disabled}
              onChange={(e) => update(i, "url", e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => remove(i)}
            aria-label="Remove link"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {links.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Add link
        </Button>
      )}
    </div>
  );
}

export function normalizeSocialUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (/^(javascript|data|vbscript|file):/i.test(v)) return null;
  if (/^mailto:/i.test(v)) {
    const email = v.slice(7);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email.toLowerCase()}` : null;
  }
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
