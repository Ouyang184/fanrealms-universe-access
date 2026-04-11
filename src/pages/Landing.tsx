import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { formatDistanceToNow } from "date-fns";

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
            <Link to="/signup" className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors">
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
              The indie creator<br />
              <span className="text-primary">marketplace.</span>
            </h1>
            <p className="mt-4 text-[15px] text-[#777] leading-relaxed max-w-md">
              Buy and sell game assets, discover indie games, find freelance work, and connect with other creators.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/marketplace" className="px-5 py-2.5 text-[14px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#be123c] transition-colors">
                Browse assets
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-[14px] font-semibold text-[#333] bg-[#f5f5f5] rounded-[10px] hover:bg-[#eee] transition-colors">
                Sell your work
              </Link>
            </div>
          </div>
          <div className="hidden md:flex gap-10 flex-shrink-0">
            {[
              { num: "4.2k", label: "Creators" },
              { num: "18k", label: "Assets" },
              { num: "930", label: "Open jobs" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-[32px] font-bold tracking-[-1px]">
                  {num}<span className="text-primary">.</span>
                </div>
                <div className="text-[12px] text-[#aaa] font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold tracking-[-0.3px]">New in Marketplace</h2>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fff0f3] text-primary">
                    {product.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* JOBS + FORUM */}
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

      {/* FOOTER */}
      <footer className="bg-[#111] text-[#666]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Logo variant="dark" />
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
          <div className="text-[12px] text-[#444]">2026 FanRealms</div>
        </div>
      </footer>
    </div>
  );
}
