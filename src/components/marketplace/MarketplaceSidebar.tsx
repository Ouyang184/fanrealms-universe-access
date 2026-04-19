import { Link } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';

const CATEGORIES = ['Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

const SORTS: { key: string; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

export const PRICE_MAX_CENTS = 10000; // $100 — anything above is treated as "any"

interface Props {
  category: string;
  maxPriceCents: number;
  sort: string;
  popularTags: string[];
  onCategory: (c: string) => void;
  onMaxPriceCents: (cents: number) => void;
  onSort: (s: string) => void;
}

export function MarketplaceSidebar({
  category,
  maxPriceCents,
  sort,
  popularTags,
  onCategory,
  onMaxPriceCents,
  onSort,
}: Props) {
  const isAny = maxPriceCents >= PRICE_MAX_CENTS;
  const dollarLabel = isAny ? 'Any price' : maxPriceCents === 0 ? 'Free only' : `Up to $${(maxPriceCents / 100).toFixed(0)}`;

  return (
    <aside className="space-y-6 text-[13px] lg:sticky lg:top-20 lg:self-start">
      <Section title="Browse">
        <UtilLink active={category === 'all'} onClick={() => onCategory('all')}>
          All categories
        </UtilLink>
        {CATEGORIES.map((c) => (
          <UtilLink key={c} active={category === c} onClick={() => onCategory(c)}>
            {c}
          </UtilLink>
        ))}
      </Section>

      <Section title="Assets by price">
        <div className="px-1 pt-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-foreground">{dollarLabel}</span>
            {!isAny && (
              <button
                onClick={() => onMaxPriceCents(PRICE_MAX_CENTS)}
                className="text-[11px] text-primary hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <Slider
            value={[Math.min(maxPriceCents, PRICE_MAX_CENTS)]}
            onValueChange={(v) => onMaxPriceCents(v[0])}
            min={0}
            max={PRICE_MAX_CENTS}
            step={100}
          />
          <div className="flex justify-between text-[10.5px] text-muted-foreground">
            <span>Free</span>
            <span>${PRICE_MAX_CENTS / 100}+</span>
          </div>
        </div>
      </Section>

      <Section title="Sort by">
        {SORTS.map((s) => (
          <UtilLink key={s.key} active={sort === s.key} onClick={() => onSort(s.key)}>
            {s.label}
          </UtilLink>
        ))}
      </Section>

      {popularTags.length > 0 && (
        <Section title="Popular tags">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-1">
            {popularTags.slice(0, 16).map((t) => (
              <Link
                key={t}
                to={`/marketplace?tag=${encodeURIComponent(t)}`}
                className="text-primary hover:underline truncate text-[12.5px]"
                title={t}
              >
                {t}
              </Link>
            ))}
          </div>
          <Link
            to="/marketplace/tags"
            className="block px-1 mt-2 text-[12px] text-muted-foreground hover:underline"
          >
            View all tags →
          </Link>
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1 pb-1 border-b border-border">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function UtilLink({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-1 py-1 text-[13px] transition-colors ${
        active ? 'text-foreground font-semibold' : 'text-primary hover:underline'
      }`}
    >
      {children}
    </button>
  );
}
