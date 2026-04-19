import { Link } from 'react-router-dom';

const CATEGORIES = ['Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

const PRICES: { key: string; label: string }[] = [
  { key: 'all', label: 'Any price' },
  { key: 'free', label: 'Free' },
  { key: 'under5', label: '$5 or less' },
  { key: 'under15', label: '$15 or less' },
  { key: 'paid', label: 'Paid' },
];

const SORTS: { key: string; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

interface Props {
  category: string;
  price: string;
  sort: string;
  popularTags: string[];
  onCategory: (c: string) => void;
  onPrice: (p: string) => void;
  onSort: (s: string) => void;
}

export function MarketplaceSidebar({
  category,
  price,
  sort,
  popularTags,
  onCategory,
  onPrice,
  onSort,
}: Props) {
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
        {PRICES.map((p) => (
          <UtilLink key={p.key} active={price === p.key} onClick={() => onPrice(p.key)}>
            {p.label}
          </UtilLink>
        ))}
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
        active
          ? 'text-foreground font-semibold'
          : 'text-primary hover:underline'
      }`}
    >
      {children}
    </button>
  );
}
