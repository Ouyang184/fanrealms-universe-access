import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useCreators } from "@/hooks/useCreators";
import { useProductSearch } from "@/hooks/useMarketplace";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, Gamepad2, FileText } from "lucide-react";
import { NSFWBadge } from "@/components/ui/nsfw-badge";
import { CreatorProfile } from "@/types";
import { formatDistanceToNow } from "date-fns";

// ── Search hooks ──────────────────────────────────────────────────────────────

function useProjectSearch(query: string) {
  return useQuery({
    queryKey: ["project-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const term = query.trim();
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, short_description, cover_image_url, genre, tags, creator_id, creators(id, username, display_name)")
        .eq("status", "published")
        .or(`title.ilike.%${term}%,short_description.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useDevlogSearch(query: string) {
  return useQuery({
    queryKey: ["devlog-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const term = query.trim();
      const { data, error } = await supabase
        .from("devlogs")
        .select("id, title, content, created_at, projects:project_id(id, title, slug)")
        .eq("status", "published")
        .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function AssetCard({ product }: { product: any }) {
  const creator = product.creators;
  const isFree = !product.price || Number(product.price) === 0;
  return (
    <Link to={`/marketplace/${product.id}`}>
      <Card className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#ddd] transition-all h-full">
        <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
          {product.cover_image_url ? (
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-[#ccc]" />
            </div>
          )}
        </div>
        <CardContent className="p-3 space-y-1">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1">{product.title}</p>
          {creator && <p className="text-[11px] text-[#999]">by {creator.display_name || creator.username}</p>}
          <div className="flex items-center justify-between pt-1">
            {product.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666]">
                {product.category}
              </span>
            )}
            <span className="text-[13px] font-bold text-primary ml-auto">
              {isFree ? "Free" : `$${Number(product.price).toFixed(2)}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectCard({ project }: { project: any }) {
  const creator = project.creators;
  return (
    <Link to={`/projects/${project.slug}`}>
      <Card className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#ddd] transition-all h-full">
        <div className="aspect-[4/3] bg-[#f5f5f5] overflow-hidden">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-[#ccc]" />
            </div>
          )}
        </div>
        <CardContent className="p-3 space-y-1">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1">{project.title}</p>
          {creator && <p className="text-[11px] text-[#999]">by {creator.display_name || creator.username}</p>}
          {project.genre && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#666] inline-block mt-1">
              {project.genre}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function PostCard({ devlog }: { devlog: any }) {
  const project = devlog.projects as any;
  return (
    <Link to={`/devlogs/${devlog.id}`}>
      <div className="bg-white border border-[#eee] rounded-xl p-4 hover:border-[#ddd] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex items-start gap-3 h-full">
        <FileText className="w-4 h-4 text-[#aaa] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#111] line-clamp-1">{devlog.title}</p>
          {devlog.content && (
            <p className="text-[12px] text-[#666] line-clamp-2 mt-0.5">{devlog.content}</p>
          )}
          <p className="text-[11px] text-[#aaa] mt-1">
            {project?.title && <span>{project.title} · </span>}
            {formatDistanceToNow(new Date(devlog.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const displayName = creator.displayName || creator.display_name || creator.username || "Creator";
  const avatarUrl = creator.profile_image_url || creator.avatar_url;
  const creatorLink = creator.username ? `/${creator.username}` : `/${creator.id}`;
  return (
    <Card className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
      <div className="h-16 bg-[#f5f5f5] relative">
        {creator.banner_url && (
          <img src={creator.banner_url} alt={displayName} className="w-full h-full object-cover" />
        )}
        {creator.is_nsfw && (
          <div className="absolute top-2 left-2"><NSFWBadge variant="card" /></div>
        )}
      </div>
      <CardContent className="pt-0 -mt-8 px-4 pb-4">
        <Avatar className="h-14 w-14 border-[4px] border-white">
          <AvatarImage src={avatarUrl || ""} alt={displayName} />
          <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="text-[14px] font-bold text-[#111] mt-2 truncate">{displayName}</h3>
        <p className="text-[#666] text-[11px] mt-0.5 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#aaa]">{creator.follower_count || 0} followers</span>
          <Button asChild className="bg-primary hover:bg-[#3a7aab] h-7 text-[11px] px-3" size="sm">
            <Link to={creatorLink}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function CardSkeletons({ count = 5, aspect = "4/3" }: { count?: number; aspect?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className={`aspect-[${aspect}] w-full rounded-none`} />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = "all" | "assets" | "projects" | "posts" | "creators";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const trimmed = searchQuery.trim();
  const hasQuery = trimmed.length >= 2;

  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Reset tab when query changes
  useEffect(() => { setActiveTab("all"); }, [searchQuery]);

  useEffect(() => {
    document.title = searchQuery
      ? `"${searchQuery}" — Search | FanRealms`
      : "Search | FanRealms";
  }, [searchQuery]);

  const { data: products = [],  isLoading: productsLoading  } = useProductSearch(trimmed);
  const { data: projects = [],  isLoading: projectsLoading  } = useProjectSearch(trimmed);
  const { data: devlogs  = [],  isLoading: devlogsLoading   } = useDevlogSearch(trimmed);
  const { data: creators = [],  isLoading: creatorsLoading  } = useCreators(trimmed);

  const isLoading = productsLoading || projectsLoading || devlogsLoading || creatorsLoading;

  const counts: Record<Tab, number> = {
    all:      products.length + projects.length + devlogs.length + creators.length,
    assets:   products.length,
    projects: projects.length,
    posts:    devlogs.length,
    creators: creators.length,
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "assets",   label: "Assets" },
    { key: "projects", label: "Projects" },
    { key: "posts",    label: "Posts" },
    { key: "creators", label: "Creators" },
  ];

  const showAssets   = activeTab === "all" || activeTab === "assets";
  const showProjects = activeTab === "all" || activeTab === "projects";
  const showPosts    = activeTab === "all" || activeTab === "posts";
  const showCreators = activeTab === "all" || activeTab === "creators";

  const hasResults = counts[activeTab] > 0;

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Search className="h-5 w-5 text-[#aaa]" />
            <h1 className="text-[22px] font-bold text-[#111]">
              {searchQuery ? `"${searchQuery}"` : "Search FanRealms"}
            </h1>
          </div>
          {hasQuery && !isLoading && (
            <p className="text-[12px] text-[#999] ml-8">
              {counts.all} result{counts.all !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Tabs — only show when there's a query */}
        {hasQuery && (
          <div className="flex gap-0 border-b border-[#eee] overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "border-primary text-[#111]"
                    : "border-transparent text-[#888] hover:text-[#111]"
                }`}
              >
                {tab.label}
                {!isLoading && counts[tab.key] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "bg-[#f0f0f0] text-[#888]"
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty / short query states */}
        {!searchQuery && (
          <div className="text-center py-24">
            <Search className="h-14 w-14 mx-auto mb-4 text-[#ddd]" />
            <h3 className="text-[18px] font-semibold text-[#666] mb-1">Search FanRealms</h3>
            <p className="text-[#aaa] text-[13px]">Find assets, projects, posts, and creators</p>
          </div>
        )}
        {searchQuery && !hasQuery && (
          <div className="text-center py-24">
            <Search className="h-14 w-14 mx-auto mb-4 text-[#ddd]" />
            <h3 className="text-[18px] font-semibold text-[#666] mb-1">Keep typing…</h3>
            <p className="text-[#aaa] text-[13px]">Enter at least 2 characters to search.</p>
          </div>
        )}

        {/* Loading */}
        {hasQuery && isLoading && (
          <div className="space-y-8">
            <CardSkeletons count={5} />
          </div>
        )}

        {/* Results */}
        {hasQuery && !isLoading && (
          <div className="space-y-10">

            {/* Assets */}
            {showAssets && products.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-[#111] mb-3 uppercase tracking-wide">
                  Assets <span className="text-[#aaa] font-normal normal-case">({products.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {(activeTab === "all" ? products.slice(0, 5) : products).map((p: any) => (
                    <AssetCard key={p.id} product={p} />
                  ))}
                </div>
                {activeTab === "all" && products.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("assets")}
                    className="mt-3 text-[12px] font-semibold text-primary hover:underline"
                  >
                    See all {products.length} assets →
                  </button>
                )}
              </section>
            )}

            {/* Projects */}
            {showProjects && projects.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-[#111] mb-3 uppercase tracking-wide">
                  Projects <span className="text-[#aaa] font-normal normal-case">({projects.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {(activeTab === "all" ? projects.slice(0, 5) : projects).map((p: any) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
                {activeTab === "all" && projects.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("projects")}
                    className="mt-3 text-[12px] font-semibold text-primary hover:underline"
                  >
                    See all {projects.length} projects →
                  </button>
                )}
              </section>
            )}

            {/* Posts */}
            {showPosts && devlogs.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-[#111] mb-3 uppercase tracking-wide">
                  Posts <span className="text-[#aaa] font-normal normal-case">({devlogs.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activeTab === "all" ? devlogs.slice(0, 4) : devlogs).map((d: any) => (
                    <PostCard key={d.id} devlog={d} />
                  ))}
                </div>
                {activeTab === "all" && devlogs.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className="mt-3 text-[12px] font-semibold text-primary hover:underline"
                  >
                    See all {devlogs.length} posts →
                  </button>
                )}
              </section>
            )}

            {/* Creators */}
            {showCreators && creators.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-[#111] mb-3 uppercase tracking-wide">
                  Creators <span className="text-[#aaa] font-normal normal-case">({creators.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {(activeTab === "all" ? creators.slice(0, 5) : creators).map((c: CreatorProfile) => (
                    <CreatorCard key={c.id} creator={c} />
                  ))}
                </div>
                {activeTab === "all" && creators.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("creators")}
                    className="mt-3 text-[12px] font-semibold text-primary hover:underline"
                  >
                    See all {creators.length} creators →
                  </button>
                )}
              </section>
            )}

            {/* No results */}
            {!hasResults && (
              <div className="text-center py-24">
                <Search className="h-14 w-14 mx-auto mb-4 text-[#ddd]" />
                <h3 className="text-[18px] font-semibold text-[#666] mb-1">No results found</h3>
                <p className="text-[#aaa] text-[13px]">
                  Nothing matched "{searchQuery}".{" "}
                  <Link to="/marketplace" className="text-primary hover:underline">
                    Browse the marketplace
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
