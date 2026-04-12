import { useAuth } from "@/contexts/AuthContext";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useJobListings } from "@/hooks/useJobs";
import { useForumThreads } from "@/hooks/useForum";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeDashboard() {
  const { profile } = useAuth();
  const { data: products } = useMarketplaceProducts("all");
  const { data: jobs } = useJobListings("all") as { data: any[] | undefined };
  const { data: threads } = useForumThreads("all") as { data: any[] | undefined };
  const { data: creatorCount } = useQuery({
    queryKey: ["creator-count"],
    queryFn: async () => {
      const { count } = await supabase.from("creators").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const name = profile?.full_name || profile?.username || "there";

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* GREETING */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.5px]">{getGreeting()}, {name}.</h1>
        <p className="text-[13px] text-[#888] mt-1">Here's what's happening in your realm today.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Jobs", value: jobs?.length ?? 0, sub: "Across all categories" },
          { label: "New Assets", value: products?.length ?? 0, sub: "Listed this week" },
          { label: "Forum Threads", value: threads?.length ?? 0, sub: "Active discussions" },
          { label: "Creators", value: creatorCount ?? 0, sub: "On the platform" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-[#eee] p-4">
            <div className="text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.5px]">{label}</div>
            <div className="text-[28px] font-bold tracking-[-1px] mt-1">{value}</div>
            <div className="text-[11px] text-[#aaa] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* JOBS + FORUM */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Open Jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold">Open Jobs</span>
            <Link to="/jobs" className="text-[12px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {(jobs ?? []).slice(0, 5).map((job: any, i: number) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 4 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{job.title}</div>
                  <div className="text-[11px] text-[#aaa]">{job.category} · {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555]">{job.budget_type}</span>
                  {job.budget_min && <span className="text-[12px] font-bold">${job.budget_min}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Forum Threads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold">Active Threads</span>
            <Link to="/forum" className="text-[12px] font-semibold text-primary">See all</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {(threads ?? []).slice(0, 5).map((thread: any, i: number) => (
              <Link
                key={thread.id}
                to={`/forum/${thread.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${i < 4 ? "border-b border-[#f5f5f5]" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {(thread.author_id || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{thread.title}</div>
                  <div className="text-[11px] text-[#aaa]">{thread.category} · {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</div>
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

      {/* NEW ASSETS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold">New in Marketplace</span>
          <Link to="/marketplace" className="text-[12px] font-semibold text-primary">See all</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(products ?? []).slice(0, 4).map((product: any) => (
            <Link
              key={product.id}
              to={`/marketplace/${product.id}`}
              className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
                {product.cover_image_url && (
                  <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
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
      </div>

    </div>
  );
}
