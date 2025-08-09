import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ContentItem } from "@/components/explore/ContentItem";
import { Post } from "@/types";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, Check, Filter, Search, Clock, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AllPostsPage() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading } = usePosts();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"most-liked" | "newest">("most-liked");

  // Fetch all likes to compute "most liked" sorting
  const { data: allLikes = [] } = useQuery({
    queryKey: ["all-likes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("post_id");
      if (error) {
        console.error("Error fetching likes:", error);
        return [] as { post_id: string }[];
      }
      return (data || []) as { post_id: string }[];
    },
    staleTime: 30000,
  });

  // Build like count map
  const likeMap = useMemo(() => {
    const m = new Map<string, number>();
    (allLikes as { post_id: string }[]).forEach((l) => {
      m.set(l.post_id, (m.get(l.post_id) || 0) + 1);
    });
    return m;
  }, [allLikes]);

  useEffect(() => {
    const title = "All Posts | FanRealms";
    const desc = "Browse public posts sorted by top rated or newest on FanRealms.";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }

    // Ensure canonical tag exists/updates
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", window.location.href);
      document.head.appendChild(canonical);
    } else {
      canonical.setAttribute("href", window.location.href);
    }
  }, []);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) {
      setTimeout(() => setSelectedPost(null), 200);
    }
  };

  // Prepare display list similar to Explore "Most Liked Posts" section (public posts only)
  const displayPosts = useMemo(() => {
    // Only public (non-premium) to match the Explore section behavior
    let result = posts.filter((p) => !p.tier_id);

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t: any) => String(t).toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sortOption === "most-liked") {
      result = [...result].sort(
        (a, b) => (likeMap.get(b.id) || 0) - (likeMap.get(a.id) || 0)
      );
    } else if (sortOption === "newest") {
      result = [...result].sort((a, b) => {
        const da = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
        const db = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
        return db - da;
      });
    }

    return result;
  }, [posts, likeMap, searchQuery, sortOption]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section (styled similar to /explore/all) */}
        {/* Removed hero to match AllCreators layout */}

        {/* Back to Explore Button */}
        <section className="mb-4">
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </div>
        </section>

        <header className="mb-6">
          <h1 className="text-3xl font-bold">All Posts</h1>
          <p className="text-muted-foreground mt-1">Browse public posts by top ratings or newest.</p>
        </header>

        {/* Filtering and Sorting */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-400" />
              <span className="font-medium">Filters:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search posts, content, or tags..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Filter className="h-4 w-4" />
                    {`Sort: ${sortOption === 'most-liked' ? 'Top Rated' : 'Newest'}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem onClick={() => setSortOption('most-liked')} className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>Top Rated</span>
                    {sortOption === 'most-liked' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('newest')} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Newest</span>
                    {sortOption === 'newest' && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{displayPosts.length} Posts</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner />
            </div>
          ) : displayPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {displayPosts.map((post) => (
                <div key={post.id} onClick={() => handlePostClick(post)} className="cursor-pointer">
                  <ContentItem post={post} type="trending" onPostClick={handlePostClick} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/30 rounded-lg border border-gray-800">
              <h3 className="text-xl font-medium mb-2">No posts found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
            </div>
          )}
        </section>

        {selectedPost && (
          <PostPreviewModal
            open={isPreviewOpen}
            onOpenChange={handleModalClose}
            post={selectedPost}
          />
        )}
      </div>
    </MainLayout>
  );
}

