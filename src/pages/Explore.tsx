
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCreators } from "@/hooks/useCreators";
import { usePosts } from "@/hooks/usePosts";
import { usePopularCreators } from "@/hooks/usePopularCreators";

// Import the refactored components
import { ExploreHero } from "@/components/explore/ExploreHero";
import { ExploreCategories } from "@/components/explore/ExploreCategories";
import { FeaturedCreators } from "@/components/explore/FeaturedCreators";
import { ContentTabs } from "@/components/explore/ContentTabs";
import { DiscoverSection } from "@/components/explore/DiscoverSection";
import { CommunitySection } from "@/components/explore/CommunitySection";
import { PopularTagsSection } from "@/components/explore/PopularTagsSection";
import { NewsletterSection } from "@/components/explore/NewsletterSection";

export default function ExplorePage() {
  // Get search parameters to check if we're filtering by category
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  
  // Fetch real data from Supabase
  const { data: allCreators = [], isLoading: isLoadingCreators } = useCreators();
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: popularCreators = [], isLoading: isLoadingPopular } = usePopularCreators();
  
  // Set document title when component mounts
  useEffect(() => {
    document.title = categoryFilter 
      ? `${categoryFilter} | FanRealms` 
      : "Explore | Creator Platform";
  }, [categoryFilter]);
  
  // State for filtered content based on category
  const [filteredCreators, setFilteredCreators] = useState(allCreators);
  const [filteredTrending, setFilteredTrending] = useState(posts);
  const [filteredNewReleases, setFilteredNewReleases] = useState(posts);
  const [filteredRecommended, setFilteredRecommended] = useState(allCreators);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter content when category or search changes
  useEffect(() => {
    if (!allCreators.length && !posts.length) return;

    let creatorFilter = allCreators;
    let postsFilter = posts;
    
    // Filter by category if present
    if (categoryFilter) {
      creatorFilter = allCreators.filter(creator => 
        (creator.bio || "").toLowerCase().includes(categoryFilter.toLowerCase())
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
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 4)); // Latest posts
    setFilteredRecommended(creatorFilter.slice(0, 4)); // Recommended creators
    
  }, [categoryFilter, searchQuery, allCreators, posts]);
  
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

        {/* Featured Creators */}
        <FeaturedCreators 
          creators={filteredCreators}
          isLoading={isLoadingCreators}
          categoryFilter={categoryFilter}
        />

        {/* Content Tabs */}
        <ContentTabs
          trendingPosts={filteredTrending}
          newReleases={filteredNewReleases}
          recommendedCreators={filteredRecommended}
          isLoadingPosts={isLoadingPosts}
          isLoadingCreators={isLoadingCreators}
        />

        {/* Discover More */}
        <DiscoverSection />

        {/* Join the Community */}
        <CommunitySection />

        {/* Popular Tags */}
        <PopularTagsSection />

        {/* Newsletter */}
        <NewsletterSection />
      </div>
    </MainLayout>
  )
}
