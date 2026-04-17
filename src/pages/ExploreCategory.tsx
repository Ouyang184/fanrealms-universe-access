
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Star,
  ChevronRight,
  ChevronLeft,
  Award,
  Check,
  SlidersHorizontal,
  TrendingUp,
  Clock,
} from "lucide-react";
import { usePopularCreators } from "@/hooks/usePopularCreators";
import { CreatorProfile } from "@/types";

// Categories data
const categories = [
  { id: 1, name: "Plugins & Addons", route: "plugins" },
  { id: 2, name: "Shaders", route: "shaders" },
  { id: 3, name: "Sprites & Art", route: "sprites" },
  { id: 4, name: "Audio & SFX", route: "audio" },
  { id: 5, name: "Games", route: "games" },
  { id: 6, name: "Tools & Utilities", route: "tools" },
];

// Category mapping for better tag matching
const categoryTagMapping: Record<string, string[]> = {
  "plugins": ["plugin", "addon", "gdscript", "extension", "module"],
  "shaders": ["shader", "glsl", "visual shader", "post processing"],
  "sprites": ["sprite", "art", "tileset", "texture", "pixel", "illustration"],
  "audio": ["audio", "music", "sfx", "sound", "loop", "bgm"],
  "games": ["game", "godot", "indie", "project"],
  "tools": ["tool", "utility", "editor", "script", "template"],
};

export default function ExploreCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [sortOption, setSortOption] = useState<string>("top-rated");
  const [contentType, setContentType] = useState<string>(category || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Find the current category object based on route parameter
  const currentCategory = categories.find(cat => cat.route === category);

  // Fetch real creators from the database
  const { data: allCreators = [], isLoading: isLoadingCreators } = usePopularCreators(true);

  // Filter creators based on the selected category
  const [filteredCreators, setFilteredCreators] = useState<CreatorProfile[]>([]);

  // Helper function to check if creator matches category
  const creatorMatchesCategory = (creator: CreatorProfile, categoryRoute: string) => {
    if (!categoryRoute || categoryRoute === "all") return true;

    const categoryTags = categoryTagMapping[categoryRoute] || [categoryRoute];
    const creatorBio = (creator.bio || "").toLowerCase();
    const creatorTags = (creator.tags || []).map(tag => tag.toLowerCase());

    // Check if any category tag matches creator's tags or bio
    return categoryTags.some(categoryTag =>
      creatorTags.some(tag => tag.includes(categoryTag) || categoryTag.includes(tag)) ||
      creatorBio.includes(categoryTag)
    );
  };

  useEffect(() => {
    // Set document title
    document.title = currentCategory
      ? `${currentCategory.name} | FanRealms`
      : "Explore Categories | FanRealms";

    // Filter creators when category or creators data changes
    if (allCreators.length > 0) {
      const filtered = allCreators.filter(creator =>
        creatorMatchesCategory(creator, category || "all")
      );

      setFilteredCreators(filtered);
    } else {
      setFilteredCreators([]);
    }

    // Update contentType state when category route changes
    if (category) {
      setContentType(category);
    }
  }, [category, allCreators, currentCategory]);

  // Apply sorting and filtering to the creators list
  const applyFilters = (creators: CreatorProfile[]) => {
    if (!creators || creators.length === 0) return [];

    let result = [...creators];

    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(creator =>
        (creator.displayName || "").toLowerCase().includes(query) ||
        (creator.username || "").toLowerCase().includes(query) ||
        (creator.bio || "").toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortOption === "top-rated") {
      result.sort((a, b) => (b.tiers?.length || 0) - (a.tiers?.length || 0));
    } else if (sortOption === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(a.created_at || Date.now()).getTime();
        const dateB = new Date(b.created_at || Date.now()).getTime();
        return dateB - dateA;
      });
    } else if (sortOption === "most-popular") {
      result.sort((a, b) => {
        const subscribersA = (a.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        const subscribersB = (b.tiers || []).reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0);
        return subscribersB - subscribersA;
      });
    }

    return result;
  };

  const displayCreators = applyFilters(filteredCreators);

  // Navigate to a different category
  const handleCategoryChange = (categoryRoute: string) => {
    if (categoryRoute === "all") {
      navigate('/explore');
    } else {
      navigate(`/explore/${categoryRoute}`);
    }
  };

  // Helper function to get creator tags
  const getCreatorTags = (creator: CreatorProfile) => {
    const defaultTags = ["Game Dev"];

    if (!creator) return defaultTags;

    if (creator.tags && creator.tags.length > 0) {
      return creator.tags.slice(0, 3);
    }

    const bio = creator.bio || "";
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));

    if (formattedTags.length === 0 && bio) {
      const keywords = bio.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);
      return keywords.length > 0 ? keywords : defaultTags;
    }

    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="w-full h-64 bg-[#f5f5f5]"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold text-[#111] mb-2">
                {currentCategory ? `${currentCategory.name}` : 'Explore FanRealms'}
              </h1>
              <p className="text-xl text-[#666] max-w-2xl mb-6">
                {currentCategory
                  ? `Discover ${currentCategory.name} from sellers on FanRealms`
                  : 'Discover assets, tools, and projects from sellers across all categories'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#888] h-4 w-4" />
                  <Input
                    placeholder="Search for sellers, assets, or topics..."
                    className="pl-10 bg-white border-[#eee] focus-visible:ring-primary w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Explore Button */}
        <section className="mb-8">
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </div>
        </section>

        {/* Filtering and Sorting */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-[#eee]">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-primary" />
                <span className="mr-3 font-medium text-[#111]">Filters:</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Category
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleCategoryChange("all")}
                    className="flex items-center gap-2"
                  >
                    {contentType === "all" && <Check className="h-4 w-4" />}
                    <span className={contentType === "all" ? "font-medium" : ""}>All Categories</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.route)}
                      className="flex items-center gap-2"
                    >
                      {cat.route === contentType && <Check className="h-4 w-4" />}
                      <span className={cat.route === contentType ? "font-medium" : ""}>{cat.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Sort: {sortOption === "top-rated" ? "Top Rated" : sortOption === "newest" ? "Newest" : "Most Popular"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("top-rated")} className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Top Rated</span>
                  {sortOption === "top-rated" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("newest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Newest</span>
                  {sortOption === "newest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("most-popular")} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Most Popular</span>
                  {sortOption === "most-popular" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Sellers Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#111]">
              {isLoadingCreators
                ? "Loading sellers..."
                : `${displayCreators.length} ${currentCategory ? `${currentCategory.name} ` : ''}Sellers`}
            </h2>
            <Button variant="link" className="text-primary">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoadingCreators ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={`creator-skeleton-${i}`} className="bg-white border-[#eee] overflow-hidden">
                  <div className="h-32 bg-[#f5f5f5]" />
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <div className="h-20 w-20 rounded-full bg-[#f5f5f5]" />
                    </div>
                    <div className="h-6 w-3/4 bg-[#f5f5f5] mt-4 rounded" />
                    <div className="h-4 w-full bg-[#f5f5f5] mt-2 rounded" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="h-5 w-16 bg-[#f5f5f5] rounded" />
                      <div className="h-5 w-20 bg-[#f5f5f5] rounded" />
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="h-5 w-16 bg-[#f5f5f5] rounded" />
                      <div className="h-10 w-24 bg-[#f5f5f5] rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayCreators.map((creator) => {
                const creatorLink = creator.username
                  ? `/creator/${creator.username}`
                  : `/creator/${creator.id}`;

                const displayName = creator.display_name || creator.username || "Seller";
                const avatarUrl = creator.profile_image_url || creator.avatar_url;
                const avatarFallback = (displayName || "S").substring(0, 1).toUpperCase();

                return (
                  <Card key={creator.id} className="bg-white border-[#eee] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
                    <div className="h-32 bg-[#f5f5f5] relative">
                      {creator.banner_url && (
                        <img
                          src={creator.banner_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <CardContent className="pt-0 -mt-12 p-6">
                      <div className="flex justify-between items-start">
                        <Avatar className="h-20 w-20 border-4 border-white">
                          <AvatarImage src={avatarUrl || ''} alt={displayName} />
                          <AvatarFallback className="bg-[#f5f5f5] text-[#666] text-xl">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <h3 className="text-xl font-bold mt-4 text-[#111]">{displayName}</h3>
                      <p className="text-[#666] text-sm mt-1 line-clamp-2">{creator.bio || "Seller on FanRealms"}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {getCreatorTags(creator).map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-[#f5f5f5] border-[#eee] text-[#666] text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-[#888]">
                          {creator.tiers && creator.tiers.length > 0 ? (
                            <span className="font-medium text-[#111]">{creator.tiers.reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0)} followers</span>
                          ) : (
                            <span className="font-medium text-[#111]">New seller</span>
                          )}
                        </div>
                        <Link to={creatorLink} className="text-[12px] font-semibold text-primary hover:underline">View shop →</Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-[#eee]">
              <h3 className="text-xl font-medium mb-2 text-[#111]">No sellers found</h3>
              <p className="text-[#666] mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "We couldn't find any sellers matching your search. Try different keywords."
                  : `We couldn't find any ${currentCategory ? currentCategory.name : ''} sellers yet. Check back soon!`}
              </p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
