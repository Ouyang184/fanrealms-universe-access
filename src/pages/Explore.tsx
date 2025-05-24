
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
  
  // Fetch real data from Supabase
  const { data: allCreators = [], isLoading: isLoadingCreators } = useCreators();
  const { data: posts = [], isLoading: isLoadingPosts } = usePosts();
  const { data: popularCreators = [], isLoading: isLoadingPopular } = usePopularCreators(true); // Explicitly exclude AI creators
  
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
    let postsFilter = posts;
    
    // Filter by category if present
    if (categoryFilter) {
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
    
  }, [categoryFilter, searchQuery, popularCreators, posts]);
  
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

        {/* Featured Creators - Only display real creators from the database */}
        <FeaturedCreators 
          creators={filteredCreators}
          isLoading={isLoadingCreators || isLoadingPopular}
          categoryFilter={categoryFilter}
        />

        {/* Content Tabs - Only display real content from the database */}
        <ContentTabs
          trendingPosts={filteredTrending}
          newReleases={filteredNewReleases}
          recommendedCreators={filteredRecommended}
          isLoadingPosts={isLoadingPosts}
          isLoadingCreators={isLoadingCreators || isLoadingPopular}
        />

        {/* Remove hardcoded data from DiscoverSection */}
        <DiscoverSection />

        {/* Community Section */}
        <CommunitySection />

        {/* Popular Tags Section */}
        <PopularTagsSection />

        {/* Newsletter Section */}
        <NewsletterSection />
      </div>
    </MainLayout>
  )
}
