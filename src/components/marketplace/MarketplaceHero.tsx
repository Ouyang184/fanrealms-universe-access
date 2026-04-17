import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const QUICK_CATEGORIES = [
  "Game Assets",
  "Templates",
  "Tools",
  "Tutorials",
  "Music",
  "Art",
];

interface MarketplaceHeroProps {
  title?: string;
  subtitle?: string;
}

export function MarketplaceHero({
  title = "Find your next asset.",
  subtitle = "Browse digital products, tools, and assets from indie creators.",
}: MarketplaceHeroProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-8 sm:p-10 mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>

      <form onSubmit={submit} className="mt-6 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets, tools, templates..."
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => navigate(`/marketplace?category=${encodeURIComponent(c)}`)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-background hover:border-primary hover:text-primary transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
