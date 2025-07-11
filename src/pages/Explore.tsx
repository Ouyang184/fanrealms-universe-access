import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import { usePosts } from "@/hooks/usePosts";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { useNSFWPreferences } from "@/hooks/useNSFWPreferences";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";
import { Post } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import the refactored components
import { ExploreHero } from "@/components/explore/ExploreHero";
import { ExploreCategories } from "@/components/explore/ExploreCategories";
import { FeaturedCreators } from "@/components/explore/FeaturedCreators";
import { ContentTabs } from "@/components/explore/ContentTabs";
import { DiscoverSection } from "@/components/explore/DiscoverSection";
import { CommunitySection } from "@/components/explore/CommunitySection";
import { PopularTagsSection } from "@/components/explore/PopularTagsSection";
import { NewsletterSection } from "@/components/explore/NewsletterSection";
import { CommissionSection } from "@/components/home/CommissionSection";

// Category mapping for better tag matching
const categoryTagMapping = {
  "art-illustration": ["art", "illustration", "drawing", "painting", "digital art", "artwork"],
  "gaming": ["gaming", "games", "esports", "streaming", "twitch"],
  "music": ["music", "audio", "songs", "beats", "musician", "producer"],
  "writing": ["writing", "author", "stories", "poetry", "blog", "content"],
  "photography": ["photography", "photos", "camera", "portrait", "landscape"],
  "education": ["education", "teaching", "tutorial", "learning", "courses"],
  "podcasts": ["podcast", "audio", "talk", "interview", "radio"],
  "cooking": ["cooking", "food", "recipes", "chef", "culinary"],
  "fitness": ["fitness", "workout", "health", "gym", "exercise"],
  "technology": ["technology", "tech", "programming", "coding", "software"],
  "fashion": ["fashion", "style", "clothing", "beauty", "makeup"],
  "film-video": ["film", "video", "movies", "cinema", "youtube", "content creator"]
};

export default function ExplorePage() {
  // Get search parameters to check if we're filtering by category
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const tabParam = searchParams.get("tab");
  
  // Get NSFW preferences to ensure content filtering
  const { data: nsfwPrefs } = useNSFWPreferences();
  
  // Fetch real data from Supabase - these hooks now automatically filter NSFW content
  const { data: allCreators = [], isLoading: isLoadingCreators } = useCreators();
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: popularCreators = [], isLoading: isLoadingPopular } = usePopularCreators(true);
  
  // Fetch all commissions data
  const { data: allCommissions = [], isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['all-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_types')
        .select(`
          *,
          creator:creators!inner(
            id,
            display_name,
            profile_image_url,
            user_id,
            accepts_commissions
          )
        `)
        .eq('is_active', true)
        .eq('creators.accepts_commissions', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all commissions:', error);
        return [];
      }

      return data || [];
    },
  });
  
  // Post preview modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Set document title when component mounts
  useEffect(() => {
    document.title = categoryFilter 
      ? `${categoryFilter} | FanRealms` 
      : "Explore | Creator Platform";
  }, [categoryFilter]);
  
  // State for filtered content based on category
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [filteredTrending, setFilteredTrending] = useState([]);
  const [filteredNewReleases, setFilteredNewReleases] = useState([]);
  const [filteredRecommended, setFilteredRecommended] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  console.log('Explore: NSFW preferences:', nsfwPrefs?.isNSFWEnabled);
  console.log('Explore: Posts count after NSFW filtering:', posts.length);

  // Helper function to check if creator matches category
  const creatorMatchesCategory = (creator, category) => {
    if (!category) return true;
    
    const categoryTags = categoryTagMapping[category] || [category];
    const creatorBio = (creator.bio || "").toLowerCase();
    const creatorTags = (creator.tags || []).map(tag => tag.toLowerCase());
    
    // Check if any category tag matches creator's tags or bio
    return categoryTags.some(categoryTag => 
      creatorTags.some(tag => tag.includes(categoryTag) || categoryTag.includes(tag)) ||
      creatorBio.includes(categoryTag)
    );
  };

  // Filter content when category or search changes
  useEffect(() => {
    if (!popularCreators.length && !posts.length) return;
    
    // Start with real creators only, from the popular creators query (which already excludes AI)
    let creatorFilter = popularCreators;
    let postsFilter = posts; // Posts are already NSFW-filtered by the hook
    
    // Filter by category if present (but not if category is "all" or undefined)
    if (categoryFilter && categoryFilter !== "all") {
      creatorFilter = popularCreators.filter(creator => 
        creatorMatchesCategory(creator, categoryFilter)
      );
      
      postsFilter = posts.filter(post => 
        (post.content || "").toLowerCase().includes(categoryFilter.toLowerCase()) ||
        (post.title || "").toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      creatorFilter = creatorFilter.filter(creator => 
        (creator.display_name || "").toLowerCase().includes(query) ||
        (creator.displayName || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
      
      postsFilter = postsFilter.filter(post => 
        (post.title || "").toLowerCase().includes(query) ||
        (post.content || "").toLowerCase().includes(query)
      );
    }
    
    // Update state with filtered data
    setFilteredCreators(creatorFilter.slice(0, 3)); // Featured creators (limited to 3)
    setFilteredTrending(postsFilter.slice(0, 4)); // Trending posts
    setFilteredNewReleases(postsFilter.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - 
      new Date(a.createdAt || Date.now()).getTime()
    ).slice(0, 4)); // Latest posts
    setFilteredRecommended(creatorFilter.slice(0, 4)); // Recommended creators
    
  }, [categoryFilter, searchQuery, popularCreators, posts, nsfwPrefs?.isNSFWEnabled]);
  
  // Handle post click
  const handlePostClick = (post: Post) => {
    console.log('Explore: Opening preview for post:', post.title);
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    console.log('Explore: Modal close triggered, open:', open);
    setIsPreviewOpen(open);
    if (!open) {
      setTimeout(() => setSelectedPost(null), 200);
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <ExploreHero 
          categoryFilter={categoryFilter} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />

        {/* Categories Section */}
        <ExploreCategories />

        {/* Featured Creators - Display all creators when no category filter or "all" is selected */}
        <FeaturedCreators 
          creators={filteredCreators}
          isLoading={isLoadingCreators || isLoadingPopular}
          categoryFilter={categoryFilter === "all" ? null : categoryFilter}
        />

        {/* Content Tabs - Display all content when no category filter or "all" is selected */}
        <ContentTabs
          trendingPosts={filteredTrending}
          newReleases={filteredNewReleases}
          recommendedCreators={filteredRecommended}
          commissions={allCommissions}
          isLoadingPosts={isLoadingPosts}
          isLoadingCreators={isLoadingCreators || isLoadingPopular}
          isLoadingCommissions={isLoadingCommissions}
          onPostClick={handlePostClick}
          defaultTab={tabParam || "trending"}
        />

        {/* Commission Section */}
        <CommissionSection />

        {/* Remove hardcoded data from DiscoverSection */}
        <DiscoverSection />

        {/* Popular Tags Section */}
        <PopularTagsSection />

        {/* Newsletter Section */}
        <NewsletterSection />
      </div>
      
      {/* Post Preview Modal */}
      {selectedPost && (
        <PostPreviewModal
          open={isPreviewOpen}
          onOpenChange={handleModalClose}
          post={selectedPost}
        />
      )}
    </MainLayout>
  )
}
