import { useSearchParams } from "react-router-dom";

const CATEGORIES = [
  "Game Assets",
  "Templates",
  "Tools",
  "Tutorials",
  "Music",
  "Art",
  "Other",
];

const PRICES = [
  { id: "all", label: "Any price" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "new", label: "Newest" },
  { id: "top", label: "Top rated" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

interface FilterSidebarProps {
  className?: string;
}

export function FilterSidebar({ className = "" }: FilterSidebarProps) {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const price = params.get("price") || "all";
  const sort = params.get("sort") || "popular";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <aside className={`bg-card border border-border rounded-xl p-5 space-y-6 ${className}`}>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Category
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => update("category", "all")}
            className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
              category === "all" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
            }`}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => update("category", c)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                category === c ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Price
        </h3>
        <div className="space-y-1">
          {PRICES.map((p) => (
            <button
              key={p.id}
              onClick={() => update("price", p.id)}
              className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                price === p.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Sort by
        </h3>
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
