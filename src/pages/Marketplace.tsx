import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { useForumThreads } from '@/hooks/useForum';
import { useJobListings } from '@/hooks/useJobs';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, DollarSign, Zap, Package, MessageSquare, Briefcase, ArrowRight, Sparkles, Search } from 'lucide-react';

const CATEGORIES = ['Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];
const PRICE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'under5', label: 'Under $5' },
  { key: 'under15', label: 'Under $15' },
];
const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('all');
  const [price, setPrice] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [searchQ, setSearchQ] = useState<string>('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const { data: allProducts, isLoading } = useMarketplaceProducts(category);

  // Client-side price filter + sort
  const products = useMemo(() => {
    if (!allProducts) return [];
    let list = [...allProducts];
    if (price === 'free') list = list.filter((p: any) => (p.price_cents ?? 0) === 0);
    if (price === 'under5') list = list.filter((p: any) => (p.price_cents ?? 0) < 500);
    if (price === 'under15') list = list.filter((p: any) => (p.price_cents ?? 0) < 1500);
    if (sort === 'price_asc') list.sort((a: any, b: any) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
    if (sort === 'price_desc') list.sort((a: any, b: any) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
    return list;
  }, [allProducts, price, sort]);

  return (
    <MainLayout>
      <div className="w-full space-y-8">
        {/* Brand hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#478cbf] via-[#3a7aab] to-[#2d5d82] p-8 sm:p-10 text-white">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[28px] sm:text-[36px] font-bold tracking-[-1px] leading-[1.1]">
              Sell your game assets. Keep 95%.
            </h1>
            <p className="text-[14px] text-white/80 mt-3 leading-relaxed">
              A marketplace for indie creators — no gatekeepers, no subscription fees. Upload art, templates, tools, music, or tutorials and start earning.
            </p>

            <form onSubmit={submitSearch} className="mt-6 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search assets, tools, templates..."
                className="w-full h-11 pl-11 pr-4 rounded-[10px] bg-white text-[#111] placeholder:text-[#888] text-[13px] focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </form>

            <div className="flex gap-3 mt-4">
              <Link
                to="/dashboard/assets"
                className="px-5 py-2.5 rounded-[10px] bg-white text-[#111] text-[13px] font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Upload an asset
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-[10px] bg-white/10 border border-white/20 backdrop-blur-sm text-white text-[13px] font-semibold hover:bg-white/15 transition-colors inline-flex items-center gap-1.5"
              >
                Create an account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {/* Decorative bg */}
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        </section>

        {/* Two-column: sidebar + main */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <SidebarSection title="Category">
              <SidebarItem active={category === 'all'} onClick={() => setCategory('all')}>All</SidebarItem>
              {CATEGORIES.map((c) => (
                <SidebarItem key={c} active={category === c} onClick={() => setCategory(c)}>{c}</SidebarItem>
              ))}
            </SidebarSection>

            <SidebarSection title="Price">
              {PRICE_FILTERS.map((p) => (
                <SidebarItem key={p.key} active={price === p.key} onClick={() => setPrice(p.key)}>{p.label}</SidebarItem>
              ))}
            </SidebarSection>

            <SidebarSection title="Sort by">
              {SORTS.map((s) => (
                <SidebarItem key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>{s.label}</SidebarItem>
              ))}
            </SidebarSection>

            <div className="rounded-xl bg-white border border-[#eee] p-4">
              <div className="text-[12px] font-bold text-[#111] mb-1">New creator?</div>
              <p className="text-[11px] text-[#666] leading-relaxed mb-3">
                Upload your first asset in under 2 minutes. No review, no approval needed.
              </p>
              <Link
                to="/dashboard/assets"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                Start selling
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-10 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#111]">
                {category === 'all' ? 'All assets' : category}
                {!isLoading && products.length > 0 && (
                  <span className="ml-2 text-[13px] font-normal text-[#888]">({products.length})</span>
                )}
              </h2>
            </div>

            {/* Products grid / empty / loading */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <FounderEmpty />
            )}

            {/* How it works */}
            <HowItWorks />

            {/* Cross content */}
            <CrossContent />
          </main>
        </div>
      </div>
    </MainLayout>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#999] mb-2 px-2">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-md text-[13px] transition-colors ${
        active ? 'bg-primary/10 text-primary font-semibold' : 'text-[#555] hover:bg-[#f5f5f5] hover:text-[#111]'
      }`}
    >
      {children}
    </button>
  );
}

function FounderEmpty() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#fafafa] to-white border border-[#eee] p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Package className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-[20px] font-bold text-[#111] mb-2">Your asset could be the first listed</h3>
      <p className="text-[13px] text-[#666] max-w-md mx-auto mb-6 leading-relaxed">
        FanRealms launched recently. Early sellers get prime visibility, founding-creator status, and our full support growing your audience.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/dashboard/assets"
          className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-[#3a7aab] transition-colors inline-flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Upload your first asset
        </Link>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Upload, title: 'Upload', body: 'Drop your file, set a price, add a cover. Takes under 2 minutes.' },
    { icon: Zap, title: 'Share', body: 'Share your listing URL anywhere. No review queue, live instantly.' },
    { icon: DollarSign, title: 'Get paid', body: 'Keep 95% per sale. Payouts via Stripe once you hit $25.' },
  ];
  return (
    <section className="rounded-2xl bg-white border border-[#eee] p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-[16px] font-bold text-[#111]">How selling works</h2>
        <span className="text-[11px] text-[#888]">3 steps · ~2 minutes</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#111] mb-0.5">
                <span className="text-[#bbb] mr-1">{i + 1}.</span>{s.title}
              </div>
              <p className="text-[12px] text-[#666] leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CrossContent() {
  const { data: threads } = useForumThreads() as { data: any[] | undefined };
  const { data: jobs } = useJobListings() as { data: any[] | undefined };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link to="/forum" className="group rounded-xl bg-white border border-[#eee] hover:border-[#ccc] p-5 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-bold text-[#111]">Latest discussions</span>
          <ArrowRight className="w-3 h-3 ml-auto text-[#bbb] group-hover:text-primary transition-colors" />
        </div>
        {threads && threads.length > 0 ? (
          <div className="space-y-2">
            {threads.slice(0, 3).map((t: any) => (
              <div key={t.id} className="text-[12px] text-[#555] truncate">· {t.title}</div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#888] leading-relaxed">
            The forum is quiet — start a thread about your game or indie dev life.
          </p>
        )}
      </Link>

      <Link to="/jobs" className="group rounded-xl bg-white border border-[#eee] hover:border-[#ccc] p-5 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-bold text-[#111]">Open jobs</span>
          <ArrowRight className="w-3 h-3 ml-auto text-[#bbb] group-hover:text-primary transition-colors" />
        </div>
        {jobs && jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.slice(0, 3).map((j: any) => (
              <div key={j.id} className="text-[12px] text-[#555] truncate">· {j.title}</div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#888] leading-relaxed">
            No open jobs yet — post a gig or freelance opportunity.
          </p>
        )}
      </Link>
    </div>
  );
}
