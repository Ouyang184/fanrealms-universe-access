import { useMemo, useState, useEffect } from 'react';
import { SlidersHorizontal, Search } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { usePopularTags } from '@/hooks/useTags';
import { useCreators } from '@/hooks/useCreators';
import { useForumThreads } from '@/hooks/useForum';
import { useJobListings } from '@/hooks/useJobs';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceSidebar, PRICE_MAX_CENTS } from '@/components/marketplace/MarketplaceSidebar';
import { FeaturedSpotlight } from '@/components/marketplace/FeaturedSpotlight';
import { ProductGridDense } from '@/components/marketplace/ProductGridDense';
import { PageSeo } from '@/components/PageSeo';

const BROWSE_CATEGORIES: { name: string; tagline: string }[] = [
  { name: 'Plugins & Addons', tagline: 'GDExtensions, editor plugins' },
  { name: 'Shaders', tagline: 'Visual effects for Godot' },
  { name: 'Scripts & Systems', tagline: 'GDScript, game systems' },
  { name: '2D Assets', tagline: 'Sprites, tilesets, UI' },
  { name: '3D Assets', tagline: 'Models, textures, environments' },
  { name: 'Complete Games', tagline: 'Full Godot game projects' },
  { name: 'Templates', tagline: 'Starter kits & boilerplates' },
  { name: 'Tools', tagline: 'Utilities & editor helpers' },
  { name: 'Tutorials', tagline: 'Learn from Godot pros' },
  { name: 'Music & SFX', tagline: 'Loops, tracks & sound effects' },
  { name: 'Other', tagline: 'Everything else' },
];

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [maxPriceCents, setMaxPriceCents] = useState<number>(PRICE_MAX_CENTS);
  const [sort, setSort] = useState<string>('newest');
  const [godotVersion, setGodotVersion] = useState<string>('all');
  // Initialise directly from URL so the first render already applies the filter
  // (useEffect fires after paint, causing an unfiltered flicker otherwise)
  const [activeTag, setActiveTag] = useState<string | null>(() => searchParams.get('tag') || null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep in sync when the URL changes (browser back/forward navigation)
  useEffect(() => {
    setActiveTag(searchParams.get('tag') || null);
  }, [searchParams]);

  const { data: allProducts, isLoading } = useMarketplaceProducts(category);
  const { data: popularTags = [] } = usePopularTags(20);

  const products = useMemo(() => {
    if (!allProducts) return [];
    let list = [...allProducts];
    if (maxPriceCents < PRICE_MAX_CENTS) {
      list = list.filter((p: any) => (p.price ?? 0) <= maxPriceCents);
    }
    if (godotVersion !== 'all') {
      list = list.filter((p: any) => p.godot_version === godotVersion);
    }
    if (activeTag) {
      list = list.filter((p: any) => Array.isArray(p.tags) && p.tags.includes(activeTag));
    }
    if (sort === 'price_asc') list.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === 'price_desc') list.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
    return list;
  }, [allProducts, maxPriceCents, godotVersion, activeTag, sort]);

  const featured = products[0];
  const newest = products.slice(1, 13);
  const free = useMemo(
    () => (allProducts ?? []).filter((p: any) => (p.price ?? 0) === 0).slice(0, 8),
    [allProducts]
  );
  const topPicks = useMemo(
    () => (allProducts ?? []).filter((p: any) => (p.price ?? 0) > 0).slice(0, 8),
    [allProducts]
  );

  return (
    <MainLayout fullWidth>
      <PageSeo
        title="Marketplace — Godot Assets, Plugins, and Tools"
        description="Browse and buy Godot plugins, shaders, sprites, 3D models, templates, music, and complete game projects from indie creators on FanRealms."
      />
      <div className="w-full space-y-4">
        <h1 className="text-[15px] font-bold text-foreground">Godot Asset Marketplace</h1>

        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3">
          FanRealms is a marketplace for indie creators — keep 95% of every sale.{' '}
          <Link to="/dashboard/assets" className="text-primary hover:underline font-medium">
            Upload an asset
          </Link>
          {' · '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </div>

        {/* Search bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            const q = searchInput.trim();
            if (q.length >= 2) navigate(`/search?q=${encodeURIComponent(q)}`);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            aria-label="Search assets, projects, and creators"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search assets, projects, creators…"
            className="w-full h-10 pl-9 pr-4 text-[13px] border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </form>

        {/* Mobile: quick category + sort dropdowns always visible */}
        <div className="lg:hidden flex gap-2 mb-3">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 text-[13px] font-medium border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-primary"
          >
            <option value="all">All categories</option>
            {BROWSE_CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 text-[13px] font-medium border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-primary"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border border-[#e5e5e5] rounded-lg hover:border-[#ccc] transition-colors whitespace-nowrap"
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filtersOpen ? 'Less' : 'More'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <MarketplaceSidebar
            category={category}
            maxPriceCents={maxPriceCents}
            sort={sort}
            popularTags={popularTags}
            godotVersion={godotVersion}
            onCategory={setCategory}
            onMaxPriceCents={setMaxPriceCents}
            onSort={setSort}
            onGodotVersion={setGodotVersion}
          />
          </div>

          <main className="space-y-6 min-w-0">
            {isLoading ? (
              <LoadingState />
            ) : products.length === 0 ? (
              <EmptyState
                popularTags={popularTags}
                onCategory={setCategory}
              />
            ) : (
              <>
                {featured && <FeaturedSpotlight product={featured as any} />}

                {newest.length > 0 && (
                  <SectionBlock
                    title={category === 'all' ? 'New & noteworthy' : category}
                    meta={`${products.length} ${products.length === 1 ? 'asset' : 'assets'}`}
                  >
                    <ProductGridDense products={newest as any} />
                  </SectionBlock>
                )}

                {topPicks.length > 0 && (
                  <SectionBlock title="Top picks" meta="Paid assets">
                    <ProductGridDense products={topPicks as any} />
                  </SectionBlock>
                )}

                {free.length > 0 && (
                  <SectionBlock title="Free this week" meta="No cost · grab and go">
                    <ProductGridDense products={free as any} />
                  </SectionBlock>
                )}
              </>
            )}
          </main>
        </div>

        <FooterStrip />
      </div>
    </MainLayout>
  );
}

function SectionBlock({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-border pb-2 mb-4">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
          {title}
        </h2>
        {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  popularTags,
  onCategory,
}: {
  popularTags: string[];
  onCategory: (c: string) => void;
}) {
  const { data: creators = [] } = useCreators();
  const { data: threads = [] } = useForumThreads();
  const { data: jobs = [] } = useJobListings();

  const topCreators = (creators as any[]).slice(0, 6);
  const recentThreads = (threads as any[])?.slice(0, 4) ?? [];
  const recentJobs = (jobs as any[])?.slice(0, 4) ?? [];

  return (
    <div className="space-y-6">
      {/* Compact utility notice */}
      <div className="border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">No assets match these filters</h3>
          <p className="text-[12px] text-muted-foreground">
            Try a different category or price — or upload the first asset here.
          </p>
        </div>
        <Link
          to="/dashboard/assets"
          className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Upload an asset
        </Link>
      </div>

      {/* Browse by category — richer tiles */}
      <section>
        <div className="flex items-baseline justify-between border-b border-border pb-2 mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
            Browse by category
          </h2>
          <span className="text-[11px] text-muted-foreground">{BROWSE_CATEGORIES.length} categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BROWSE_CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => onCategory(c.name)}
              className="group border border-border bg-card hover:border-foreground hover:bg-accent px-3 py-3 text-left transition-colors flex flex-col justify-between min-h-[88px]"
            >
              <div>
                <div className="text-[13px] font-bold text-foreground">{c.name}</div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{c.tagline}</div>
              </div>
              <span className="text-[11px] text-primary mt-2 group-hover:underline">Browse →</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured creators */}
      {topCreators.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              Featured creators
            </h2>
            <Link to="/marketplace" className="text-[11px] text-primary hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {topCreators.map((c: any) => (
              <Link
                key={c.id}
                to={`/creator/${c.username}`}
                className="border border-border bg-card hover:border-foreground hover:bg-accent p-2 flex flex-col items-center text-center transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden mb-1.5">
                  {c.profile_image_url ? (
                    <img src={c.profile_image_url} alt={c.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-muted-foreground">
                      {(c.display_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-foreground truncate w-full" title={c.display_name}>
                  {c.display_name || c.username}
                </div>
                <div className="text-[10.5px] text-muted-foreground">
                  {(c.follower_count || 0).toLocaleString()} followers
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Forum + Jobs cross-pillar block */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-2">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              Latest discussions
            </h2>
            <Link to="/forum" className="text-[11px] text-primary hover:underline">
              Forum →
            </Link>
          </div>
          {recentThreads.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-2">No threads yet.</p>
          ) : (
            <ul className="divide-y divide-border border border-border bg-card">
              {recentThreads.map((t: any) => (
                <li key={t.id}>
                  <Link
                    to={`/forum/${t.id}`}
                    className="block px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="text-[12.5px] font-semibold text-foreground truncate">{t.title}</div>
                    <div className="text-[10.5px] text-muted-foreground mt-0.5">
                      {t.category || 'General'} · {t.reply_count ?? 0} replies
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-2">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              Open gigs
            </h2>
            <Link to="/jobs" className="text-[11px] text-primary hover:underline">
              Jobs →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-2">No open gigs right now.</p>
          ) : (
            <ul className="divide-y divide-border border border-border bg-card">
              {recentJobs.map((j: any) => (
                <li key={j.id}>
                  <Link
                    to={`/jobs/${j.id}`}
                    className="block px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="text-[12.5px] font-semibold text-foreground truncate">{j.title}</div>
                    <div className="text-[10.5px] text-muted-foreground mt-0.5">
                      {j.category} ·{' '}
                      {j.budget_min || j.budget_max
                        ? `$${j.budget_min ?? '?'}–$${j.budget_max ?? '?'}`
                        : 'Budget on request'}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Popular tags cloud */}
      {popularTags.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              Popular tags
            </h2>
            <Link to="/marketplace" className="text-[11px] text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.slice(0, 30).map((t) => (
              <Link
                key={t}
                to={`/marketplace?tag=${encodeURIComponent(t)}`}
                className="inline-flex items-center px-2 py-1 border border-border bg-card text-[12px] text-foreground hover:border-foreground hover:bg-accent transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FooterStrip() {
  return (
    <section className="border-t border-border pt-5 mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-[12px]">
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">For creators</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link to="/dashboard/assets" className="hover:text-foreground hover:underline">Upload an asset</Link></li>
          <li><Link to="/dashboard" className="hover:text-foreground hover:underline">Creator dashboard</Link></li>
          <li><Link to="/signup" className="hover:text-foreground hover:underline">Become a creator</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">Explore</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link to="/marketplace" className="hover:text-foreground hover:underline">Marketplace</Link></li>
          <li><Link to="/forum" className="hover:text-foreground hover:underline">Forum</Link></li>
          <li><Link to="/jobs" className="hover:text-foreground hover:underline">Jobs</Link></li>
          <li><Link to="/marketplace" className="hover:text-foreground hover:underline">Discover creators</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">Community</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link to="/forum" className="hover:text-foreground hover:underline">Discussions</Link></li>
          <li><Link to="/marketplace" className="hover:text-foreground hover:underline">Browse tags</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-2">About</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li><Link to="/about" className="hover:text-foreground hover:underline">About FanRealms</Link></li>
          <li><Link to="/terms" className="hover:text-foreground hover:underline">Terms</Link></li>
          <li><Link to="/privacy-policy" className="hover:text-foreground hover:underline">Privacy</Link></li>
        </ul>
      </div>
    </section>
  );
}
