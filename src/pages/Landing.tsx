import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { useActiveJam, getJamStatus } from "@/hooks/useJam";
import { formatDistanceToNow } from "date-fns";
import { ShoppingBag, Gamepad2, Briefcase, MessageSquare, Search } from "lucide-react";
import { ThreadAuthorAvatar } from "@/components/forum/ThreadAuthorAvatar";
import { PageSeo } from "@/components/PageSeo";

// A few published games for the homepage showcase
function useLandingGames() {
  return useQuery({
    queryKey: ['landing-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, slug, short_description, cover_image_url, creators(username, display_name)')
        .eq('status', 'published')
        .eq('classification', 'game')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const { data: products } = useMarketplaceProducts("all");
  const { data: games = [] } = useLandingGames();
  const { data: jobs } = useJobListings("all") as { data: any[] | undefined };
  const { data: threads } = useForumThreads("all") as { data: any[] | undefined };
  const { data: activeJam } = useActiveJam();
  const jamStatus = activeJam ? getJamStatus(activeJam) : null;
  const showJam = jamStatus === 'upcoming' || jamStatus === 'active' || jamStatus === 'voting';

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans">
      <PageSeo
        title="FanRealms: Marketplace and Jobs for Godot Creators"
        description="Buy and sell Godot assets, find freelance work, and connect with indie game developers on FanRealms — the home for Godot creators."
        canonicalPath="/"
      />

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#eee]">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-2">
          <Logo className="mr-4" />
          <nav className="hidden md:flex gap-1">
            {[
              { to: "/marketplace", label: "Marketplace" },
              { to: "/games", label: "Games" },
              { to: "/jobs", label: "Jobs" },
              { to: "/forum", label: "Forum" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#777] hover:bg-[#f5f5f5] hover:text-[#111] transition-colors"
              >
                {label}
              </Link>
            ))}
            {showJam && activeJam && (
              <Link
                to={`/jam/${activeJam.id}`}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold whitespace-nowrap text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                {jamStatus === 'voting' ? 'Vote Now' : 'Asset Pack Jam'}
                {(jamStatus === 'active' || jamStatus === 'voting') && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                )}
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-[13px] font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:border-[#ccc] transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* HERO */}
      <section className="border-b border-[#eee] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="md:col-span-7">
            <h1 className="text-5xl font-bold tracking-[-1.5px] leading-[1.1]">
              The marketplace for<br />
              <span className="text-primary">indie game creators.</span>
            </h1>
            <p className="mt-4 text-[15px] text-[#777] leading-relaxed max-w-md">
              Buy and sell game assets, find freelance work, and connect with other indie developers — built with Godot creators in mind, open to everyone.
            </p>
            <form
              onSubmit={e => {
                e.preventDefault();
                const q = searchInput.trim();
                navigate(q.length >= 2 ? `/search?q=${encodeURIComponent(q)}` : '/marketplace');
              }}
              className="relative mt-6 max-w-md"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search assets, games, creators…"
                aria-label="Search assets, games, and creators"
                className="w-full h-12 pl-11 pr-28 text-[14px] border border-[#e5e5e5] rounded-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 h-9 text-[13px] font-semibold text-white bg-primary rounded-[9px] hover:bg-[#3a7aab] transition-colors"
              >
                Search
              </button>
            </form>
            <div className="flex gap-3 mt-3">
              <Link to="/marketplace" className="px-5 py-2.5 text-[14px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
                Browse assets
              </Link>
              <Link to="/games" className="px-5 py-2.5 text-[14px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors">
                Browse games
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-[#666]">Free to join · Payments secured by Stripe · No hidden fees</p>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-4">
            {[
              { Icon: ShoppingBag, title: "Game Assets", desc: "Sprites, tilesets, shaders, plugins & more" },
              { Icon: Gamepad2,    title: "Indie Games",  desc: "Play & discover community-made games" },
              { Icon: Briefcase,   title: "Jobs & Gigs",  desc: "Hire developers, artists & designers" },
              { Icon: MessageSquare, title: "Community",  desc: "Forum, devlogs & help" },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="aspect-square p-5 rounded-2xl bg-[#fafafa] border border-[#eee] hover:border-primary/30 transition-colors flex flex-col justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#111]">{title}</div>
                  <div className="text-[12px] text-[#666] mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#eee] bg-[#fafafa]">
        <div className="px-4 sm:px-6 py-12">
          <h2 className="text-[13px] font-bold text-[#666] uppercase tracking-[1px] text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Sign up free",
                desc: "Create your account in seconds. Free to browse and download assets.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "2",
                title: "Find or list game assets",
                desc: "Buy sprites, tilesets, shaders & plugins — or upload your own packs for sale.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "3",
                title: "Build & ship",
                desc: "Get the tools you need, find collaborators in the forum, and ship your game.",
                color: "bg-green-50 text-green-600",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="text-center">
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-[15px] font-bold mx-auto mb-3`}>
                  {step}
                </div>
                <div className="text-[15px] font-bold text-[#111] mb-1">{title}</div>
                <div className="text-[13px] text-[#777] leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      {products && products.length > 0 ? (
        <section className="px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">New assets</h2>
            <Link to="/marketplace" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(products ?? []).slice(0, 4).map((product: any) => (
              <Link
                key={product.id}
                to={`/marketplace/${product.id}`}
                className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
                  {(product.cover_image_url || product.preview_image_url) && (
                    <img
                      src={product.cover_image_url || product.preview_image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-semibold leading-snug truncate">{product.title}</div>
                  <div className="text-[11px] text-[#666] mt-0.5 truncate">
                    {product.creators?.display_name || product.creators?.username}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1">
                      <span className="text-[14px] font-bold">
                        {product.price === 0
                          ? "Free"
                          : product.sale_price != null && Number(product.sale_price) < Number(product.price)
                          ? `$${Number(product.sale_price).toFixed(2)}`
                          : `$${Number(product.price).toFixed(2)}`}
                      </span>
                      {product.sale_price != null && Number(product.sale_price) < Number(product.price) && (
                        <span className="text-[11px] text-[#999] line-through">${Number(product.price).toFixed(2)}</span>
                      )}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef4fb] text-primary">
                      {product.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="px-4 sm:px-6 py-10">
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-4 h-4 text-[#666]" />
            </div>
            <div className="text-[16px] font-bold text-[#111] mb-1">Be the first to list an asset</div>
            <div className="text-[13px] text-[#666] mb-4 max-w-sm mx-auto">
              Upload a sprite pack, tileset, shader, or plugin — and be the first seller on the marketplace.
            </div>
            <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
              Start selling →
            </Link>
          </div>
        </section>
      )}

      {/* GAMES SHOWCASE */}
      {games.length > 0 && (
        <section className="px-4 sm:px-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px] flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-primary" /> Games on FanRealms
            </h2>
            <Link to="/games" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {games.map((g: any) => (
              <Link
                key={g.id}
                to={`/projects/${g.slug}`}
                className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
                  {g.cover_image_url ? (
                    <img src={g.cover_image_url} alt={g.title} className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 className="w-6 h-6 text-[#ccc]" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-semibold leading-snug truncate">{g.title}</div>
                  <div className="text-[11px] text-[#666] mt-0.5 truncate">
                    {g.creators?.display_name || g.creators?.username}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JOBS + FORUM */}
      {((jobs && jobs.length > 0) || (threads && threads.length > 0)) ? (
        <section className="px-4 sm:px-6 pb-10">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Jobs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold tracking-[-0.3px]">Open Jobs</h2>
                <Link to="/jobs" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
              </div>
              <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
                {(jobs ?? []).slice(0, 4).map((job: any, i: number) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 3 ? "border-b border-[#f5f5f5]" : ""}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{job.title}</div>
                      <div className="text-[11px] text-[#666] mt-0.5">
                        {job.category} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555]">{job.budget_type}</span>
                      {job.budget_min && (
                        <span className="text-[12px] font-bold">${job.budget_min}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Forum */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold tracking-[-0.3px]">Forum</h2>
                <Link to="/forum" className="text-[13px] font-semibold text-primary hover:underline">See all</Link>
              </div>
              <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
                {(threads ?? []).slice(0, 4).map((thread: any, i: number) => (
                  <Link
                    key={thread.id}
                    to={`/forum/${thread.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 3 ? "border-b border-[#f5f5f5]" : ""}`}
                  >
                    <ThreadAuthorAvatar
                      user={thread.users}
                      fallbackClassName="bg-[#111] text-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold leading-snug truncate">{thread.title}</div>
                      <div className="text-[11px] text-[#666] mt-0.5">
                        {thread.category} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
                      <div className="text-[10px] text-[#666]">replies</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-4 sm:px-6 pb-10">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-4 h-4 text-[#666]" />
              </div>
              <div className="text-[15px] font-bold text-[#111] mb-1">Post a Godot gig</div>
              <div className="text-[12px] text-[#666] mb-4">Looking for a GDScript dev, pixel artist, or sound designer?</div>
              <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                Post a job
              </Link>
            </div>
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-4 h-4 text-[#666]" />
              </div>
              <div className="text-[15px] font-bold text-[#111] mb-1">Start the first Godot thread</div>
              <div className="text-[12px] text-[#666] mb-4">Ask a question, share a devlog, or introduce your project.</div>
              <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                Start a thread
              </Link>
            </div>
          </div>
        </section>
      )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#fafafa] border-t border-[#eee] text-[#777]">
        <div className="px-4 sm:px-6 py-8 flex items-center justify-between">
          <div>
            <Logo />
            <div className="text-[11px] text-[#666] mt-1">The Godot asset hub.</div>
          </div>
          <div className="flex gap-6 text-[12px]">
            {[
              { label: "About", to: "/about" },
              { label: "Terms", to: "/terms" },
              { label: "Privacy", to: "/privacy-policy" },
              { label: "Help", to: "/help" },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="hover:text-[#111] transition-colors">{label}</Link>
            ))}
          </div>
          <div className="text-[12px] text-[#666]">© 2026 FanRealms</div>
        </div>
      </footer>
    </div>
  );
}
