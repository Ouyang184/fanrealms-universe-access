import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { formatDistanceToNow } from "date-fns";
import { ShoppingBag, Gamepad2, Briefcase, MessageSquare } from "lucide-react";

export default function LandingPage() {
  const { data: products } = useMarketplaceProducts("all");
  const { data: jobs } = useJobListings("all") as { data: any[] | undefined };
  const { data: threads } = useForumThreads("all") as { data: any[] | undefined };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#eee]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-2">
          <Logo className="mr-4" />
          <nav className="hidden md:flex gap-1">
            {[
              { to: "/marketplace", label: "Marketplace" },
              { to: "/explore", label: "Explore" },
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

      {/* HERO */}
      <section className="border-b border-[#eee] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex items-center justify-between gap-12">
          <div>
            <h1 className="text-5xl font-bold tracking-[-1.5px] leading-[1.1]">
              Where Godot devs<br />
              <span className="text-primary">buy, sell &amp; ship.</span>
            </h1>
            <p className="mt-4 text-[15px] text-[#777] leading-relaxed max-w-md">
              Assets, indie games, freelance gigs, and a community — all built around the Godot engine.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/marketplace" className="px-5 py-2.5 text-[14px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
                Browse assets
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-[14px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors">
                Sell your work
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-[#aaa]">Free to join · Payments secured by Stripe · No hidden fees</p>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-3 flex-shrink-0 w-[320px]">
            {[
              { Icon: ShoppingBag, title: "Godot Assets", desc: "Plugins, shaders, sprites & tools" },
              { Icon: Gamepad2,    title: "Indie Games",  desc: "Play & discover Godot-made games" },
              { Icon: Briefcase,   title: "Jobs & Gigs",  desc: "Hire or get hired as a Godot dev" },
              { Icon: MessageSquare, title: "Community",  desc: "Forum, devlogs & help" },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#eee] flex items-center justify-center mb-2.5">
                  <Icon className="w-4 h-4 text-[#555]" />
                </div>
                <div className="text-[13px] font-bold text-[#111]">{title}</div>
                <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[#eee] bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-[13px] font-bold text-[#aaa] uppercase tracking-[1px] text-center mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Sign up free",
                desc: "Create your account in seconds. Free to browse and download assets.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "2",
                title: "Find or list Godot assets",
                desc: "Buy plugins, shaders, and sprites — or upload your own packs for sale.",
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
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-[-0.3px]">New Godot assets</h2>
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
                  <div className="text-[11px] text-[#aaa] mt-0.5 truncate">
                    {product.creators?.display_name || product.creators?.username}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[14px] font-bold">
                      {product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`}
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
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-4 h-4 text-[#bbb]" />
            </div>
            <div className="text-[16px] font-bold text-[#111] mb-1">Be the first to list a Godot asset</div>
            <div className="text-[13px] text-[#888] mb-4 max-w-sm mx-auto">
              Upload a plugin, shader pack, or sprite set — and be the first seller on the marketplace.
            </div>
            <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors">
              Start selling →
            </Link>
          </div>
        </section>
      )}

      {/* JOBS + FORUM */}
      {((jobs && jobs.length > 0) || (threads && threads.length > 0)) ? (
        <section className="max-w-6xl mx-auto px-6 pb-10">
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
                      <div className="text-[11px] text-[#aaa] mt-0.5">
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
                    <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                      {(thread.users?.username || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold leading-snug truncate">{thread.title}</div>
                      <div className="text-[11px] text-[#aaa] mt-0.5">
                        {thread.category} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] font-bold">{thread.reply_count ?? 0}</div>
                      <div className="text-[10px] text-[#ccc]">replies</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-4 h-4 text-[#bbb]" />
              </div>
              <div className="text-[15px] font-bold text-[#111] mb-1">Post a Godot gig</div>
              <div className="text-[12px] text-[#999] mb-4">Looking for a GDScript dev, pixel artist, or sound designer?</div>
              <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                Post a job
              </Link>
            </div>
            <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-4 h-4 text-[#bbb]" />
              </div>
              <div className="text-[15px] font-bold text-[#111] mb-1">Start the first Godot thread</div>
              <div className="text-[12px] text-[#999] mb-4">Ask a question, share a devlog, or introduce your project.</div>
              <Link to="/signup" className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                Start a thread
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#111] text-[#666]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <Logo variant="dark" />
            <div className="text-[11px] text-[#555] mt-1">The Godot asset hub.</div>
          </div>
          <div className="flex gap-6 text-[12px]">
            {[
              { label: "About", to: "/about" },
              { label: "Terms", to: "/terms" },
              { label: "Privacy", to: "/privacy-policy" },
              { label: "Help", to: "/help" },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="hover:text-[#999] transition-colors">{label}</Link>
            ))}
          </div>
          <div className="text-[12px] text-[#444]">© 2026 FanRealms</div>
        </div>
      </footer>
    </div>
  );
}
