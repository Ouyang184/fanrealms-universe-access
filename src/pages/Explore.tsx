
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  Clock,
  Video,
  FileText,
  Heart,
  ChevronRight,
  Award,
  Users,
  Zap,
  Music,
  Palette,
  Camera,
  Code,
  BookOpen,
  Coffee,
  Gamepad2,
  Mic,
  Dumbbell,
  Eye,
  Bell,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CategoryGrid } from "@/components/onboarding/CategoryGrid"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreators } from "@/hooks/useCreators"
import { usePosts } from "@/hooks/usePosts"
import { usePopularCreators } from "@/hooks/usePopularCreators"
import { formatRelativeDate } from "@/utils/auth-helpers"

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

  // Helper function to get creator tags
  const getCreatorTags = (creator) => {
    // Extract tags from bio or default to category tags
    const defaultTags = ["Content Creator"];
    
    if (!creator) return defaultTags;
    
    const bio = creator.bio || "";
    // Extract hashtags or keywords from bio
    const extractedTags = bio.match(/#\w+/g) || [];
    const formattedTags = extractedTags.map(tag => tag.replace('#', ''));
    
    return formattedTags.length > 0 ? formattedTags : defaultTags;
  };

  // Helper functions to determine content type
  const determineContentType = (post) => {
    if (!post || !post.content) return "post";
    if (post.content.includes('youtube.com') || post.content.includes('vimeo.com')) {
      return "video";
    } else if (post.content.length > 1000) {
      return "article";
    } else {
      return "post";
    }
  };
  
  // Generate a thumbnail for a post
  const getPostThumbnail = (post) => {
    return post?.thumbnail || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(post.title || "Post")}`;
  };

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
        <section className="mb-10">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <div className="w-full h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">
                {categoryFilter ? `Explore ${categoryFilter}` : 'Explore FanRealms'}
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                {categoryFilter 
                  ? `Discover amazing ${categoryFilter} creators and their exclusive content`
                  : 'Discover amazing creators and exclusive content across various categories'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for creators, content, or topics..."
                    className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse Categories</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Use the CategoryGrid component */}
          <CategoryGrid 
            selectedCategories={[]} 
            onToggle={() => {}} 
            linkToCategory={true} 
          />
        </section>

        {/* Featured Creators */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {categoryFilter ? `${categoryFilter} Creators` : 'Featured Creators'}
            </h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingCreators ? (
              // Loading skeletons
              Array(3).fill(0).map((_, i) => (
                <Card key={`creator-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-32 bg-gray-800" />
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-20 w-20 rounded-md" />
                      <Skeleton className="h-6 w-20 mt-2" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mt-4" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full -ml-2" />
                      <Skeleton className="h-4 w-32 ml-2" />
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCreators.length > 0 ? (
              filteredCreators.map((creator) => (
                <Card key={creator.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                    {creator.banner_url && (
                      <img
                        src={creator.banner_url}
                        alt={creator.display_name || "Creator"}
                        className="w-full h-full object-cover mix-blend-overlay"
                      />
                    )}
                    <Badge className="absolute top-2 right-2 bg-purple-600 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Featured
                    </Badge>
                  </div>
                  <CardContent className="pt-0 -mt-12 p-6">
                    <div className="flex justify-between items-start">
                      <Avatar className="h-20 w-20 border-4 border-gray-900">
                        <AvatarImage 
                          src={creator.profile_image_url || creator.avatar_url || `/placeholder.svg?text=${(creator.display_name || "C").substring(0, 1)}`} 
                          alt={creator.display_name || "Creator"} 
                        />
                        <AvatarFallback className="bg-gray-800 text-xl">
                          {(creator.display_name || "C").substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1 mt-2 bg-gray-800 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">{(4 + Math.random()).toFixed(1)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mt-4">{creator.display_name || "Creator"}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {getCreatorTags(creator).map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Avatar className="h-6 w-6 border-2 border-gray-900">
                        <AvatarFallback className="bg-purple-900 text-xs">U1</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                        <AvatarFallback className="bg-blue-900 text-xs">U2</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                        <AvatarFallback className="bg-green-900 text-xs">U3</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">+{Math.floor(Math.random() * 2000) + 500} subscribers</span>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        From <span className="font-medium text-white">${(9.99).toFixed(2)}/mo</span>
                      </div>
                      <Link to={`/creator/${creator.id}`}>
                        <Button className="bg-purple-600 hover:bg-purple-700">View Creator</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 text-gray-400">
                No creators found. Try adjusting your search or filters.
              </div>
            )}
          </div>
        </section>

        {/* Content Tabs */}
        <section className="mb-10">
          <Tabs defaultValue="trending" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-gray-900 border-gray-800">
                <TabsTrigger value="trending" className="data-[state=active]:bg-purple-900/30">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-purple-900/30">
                  <Clock className="h-4 w-4 mr-2" />
                  New Releases
                </TabsTrigger>
                <TabsTrigger value="recommended" className="data-[state=active]:bg-purple-900/30">
                  <Zap className="h-4 w-4 mr-2" />
                  Recommended
                </TabsTrigger>
              </TabsList>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                  <DropdownMenuItem>Most Popular</DropdownMenuItem>
                  <DropdownMenuItem>Newest First</DropdownMenuItem>
                  <DropdownMenuItem>Highest Rated</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem>Free Content</DropdownMenuItem>
                  <DropdownMenuItem>Premium Content</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value="trending" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoadingPosts ? (
                  // Loading skeletons for trending content
                  Array(4).fill(0).map((_, i) => (
                    <Card key={`trending-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                      <Skeleton className="h-40 w-full" />
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-full mb-1" />
                        <Skeleton className="h-5 w-4/5" />
                        <div className="flex items-center gap-3 mt-2">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-24" />
                      </CardFooter>
                    </Card>
                  ))
                ) : filteredTrending.length > 0 ? (
                  filteredTrending.map((post) => (
                    <Card key={post.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                      <div className="relative">
                        <img
                          src={getPostThumbnail(post)}
                          alt={post.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-orange-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Trending
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                          {Math.floor(Math.random() * 60) + 5}m
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {determineContentType(post) === "video" && <Video className="h-3 w-3" />}
                          {determineContentType(post) === "article" && <FileText className="h-3 w-3" />}
                          {determineContentType(post)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.authorAvatar || `/placeholder.svg?text=${(post.authorName || "C").substring(0, 1)}`} alt={post.authorName || "Creator"} />
                            <AvatarFallback className="text-xs">{(post.authorName || "C").substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-400">{post.authorName || "Creator"}</span>
                        </div>
                        <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {Math.floor(Math.random() * 10000) + 500}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {Math.floor(Math.random() * 1000) + 50}
                          </div>
                          <Badge className="ml-auto bg-purple-600">{post.tier_id ? "Premium" : "Free"}</Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="ghost" size="sm" className="text-purple-400 p-0">
                          Preview
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Subscribe
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-10 text-gray-400">
                    No trending content found.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoadingPosts ? (
                  // Loading skeletons for new releases
                  Array(4).fill(0).map((_, i) => (
                    <Card key={`new-skeleton-${i}`} className="bg-gray-900 border-gray-800 overflow-hidden">
                      <Skeleton className="h-40 w-full" />
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-full mb-1" />
                        <Skeleton className="h-5 w-4/5" />
                        <div className="flex items-center gap-3 mt-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-24" />
                      </CardFooter>
                    </Card>
                  ))
                ) : filteredNewReleases.length > 0 ? (
                  filteredNewReleases.map((post) => (
                    <Card key={post.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                      <div className="relative">
                        <img
                          src={getPostThumbnail(post)}
                          alt={post.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-blue-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> New
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                          {Math.floor(Math.random() * 60) + 5}m
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {determineContentType(post) === "video" && <Video className="h-3 w-3" />}
                          {determineContentType(post) === "article" && <FileText className="h-3 w-3" />}
                          {determineContentType(post)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.authorAvatar || `/placeholder.svg?text=${(post.authorName || "C").substring(0, 1)}`} alt={post.authorName || "Creator"} />
                            <AvatarFallback className="text-xs">{(post.authorName || "C").substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-400">{post.authorName || "Creator"}</span>
                        </div>
                        <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeDate(post.createdAt)}
                          </div>
                          <Badge className="ml-auto bg-purple-600">{post.tier_id ? "Premium" : "Free"}</Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="ghost" size="sm" className="text-purple-400 p-0">
                          Preview
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Subscribe
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-10 text-gray-400">
                    No new releases found.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommended" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoadingCreators ? (
                  // Loading skeletons for recommended creators
                  Array(4).fill(0).map((_, i) => (
                    <Card key={`rec-skeleton-${i}`} className="bg-gray-900 border-gray-800 flex overflow-hidden">
                      <div className="p-4 flex-shrink-0">
                        <Skeleton className="h-16 w-16 rounded-full" />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full mt-2" />
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filteredRecommended.length > 0 ? (
                  filteredRecommended.map((creator) => (
                    <Card key={creator.id} className="bg-gray-900 border-gray-800 flex overflow-hidden">
                      <div className="p-4 flex-shrink-0">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={creator.profile_image_url || creator.avatar_url || `/placeholder.svg?text=${(creator.display_name || "C").substring(0, 1)}`} alt={creator.display_name || "Creator"} />
                          <AvatarFallback className="bg-gray-800 text-xl">{(creator.display_name || "C").substring(0, 1)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold">{creator.display_name || creator.username || "Creator"}</h3>
                          <Badge variant="outline" className="bg-gray-800 border-gray-700">
                            {Math.floor(Math.random() * 10000) + 100} subscribers
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{creator.bio || "Creator on FanRealms"}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getCreatorTags(creator).slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm">
                            <span className="text-gray-400">From </span>
                            <span className="font-medium">${(9.99).toFixed(2)}/mo</span>
                          </div>
                          <Link to={`/creator/${creator.id}`}>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              View Creator
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 text-gray-400">
                    No recommended creators found.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Discover More */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Discover More</h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=Top+Rated"
                  alt="Top Rated Creators"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">Top Rated Creators</h3>
                    <p className="text-sm text-gray-300 mt-1">Discover the highest rated creators on FanRealms</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Explore Top Rated</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=New+Creators"
                  alt="New Creators"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">New Creators</h3>
                    <p className="text-sm text-gray-300 mt-1">Support creators who are just getting started</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Discover New Talent</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=400&text=Free+Content"
                  alt="Free Content"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-xl font-bold">Free Content</h3>
                    <p className="text-sm text-gray-300 mt-1">Explore free content from various creators</p>
                  </div>
                </div>
              </div>
              <CardFooter className="p-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Browse Free Content</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Join the Community */}
        <section className="mb-10">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">Join Our Creator Community</h2>
                  <p className="text-gray-300 mb-6">
                    Start sharing your passion and expertise with subscribers around the world. Build your audience and
                    earn from your content on FanRealms.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-purple-600 hover:bg-purple-700">Become a Creator</Button>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <img
                    src="/placeholder.svg?height=200&width=200&text=Creator+Community"
                    alt="Creator Community"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Popular Tags */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Popular Tags</h2>
          <div className="flex flex-wrap gap-3">
            {[
              "Digital Art",
              "Game Development",
              "Music Production",
              "Photography",
              "Creative Writing",
              "Cooking",
              "Fitness",
              "Web Development",
              "Animation",
              "Podcasting",
              "Graphic Design",
              "3D Modeling",
              "Video Editing",
              "Illustration",
              "UI/UX Design",
            ].map((tag, index) => (
              <Badge key={index} className="bg-gray-800 hover:bg-gray-700 cursor-pointer text-sm py-1.5 px-3">
                {tag}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="text-purple-400">
              View All Tags
            </Button>
          </div>
        </section>

        {/* Newsletter */}
        <section>
          <Card className="bg-purple-900/30 border-purple-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
                  <p className="text-gray-300 mb-6">
                    Subscribe to our newsletter to get weekly updates on new creators, trending content, and exclusive
                    offers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Enter your email"
                      className="bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500"
                    />
                    <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">Subscribe</Button>
                  </div>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <Bell className="h-20 w-20 text-purple-400 opacity-80" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
