
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner"; 
import PostCard from "@/components/PostCard";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Post, CreatorProfile } from "@/types";

// Placeholder data for the explore page
const explorePosts = [
  {
    id: 1,
    title: "Discover Hidden Gems: Independent Game Development Series",
    description: "An ongoing series featuring the most innovative independent game developers and their creative processes.",
    image: "https://picsum.photos/seed/explore1/800/450",
    authorName: "GameCraft Studio",
    authorAvatar: "https://picsum.photos/seed/creator1/100/100",
    date: "Just now"
  },
  {
    id: 2,
    title: "Art in Motion: Monthly Animation Masterclass",
    description: "Join our monthly deep dives into advanced animation techniques with industry veterans.",
    image: "https://picsum.photos/seed/explore2/800/450",
    authorName: "Animation Central",
    authorAvatar: "https://picsum.photos/seed/creator2/100/100",
    date: "2 hours ago"
  },
  {
    id: 3,
    title: "Writer's Room: Crafting Compelling Narratives",
    description: "A collaborative workshop series for authors and screenwriters looking to refine their storytelling.",
    image: "https://picsum.photos/seed/explore3/800/450",
    authorName: "Narrative Nexus",
    authorAvatar: "https://picsum.photos/seed/creator3/100/100",
    date: "1 day ago"
  },
  {
    id: 4,
    title: "Web Development Trends 2025: What's Next?",
    description: "Exploring emerging technologies and methodologies that will shape the future of web development.",
    image: "https://picsum.photos/seed/explore4/800/450",
    authorName: "Tech Forward",
    authorAvatar: "https://picsum.photos/seed/creator4/100/100",
    date: "3 days ago"
  },
  {
    id: 5,
    title: "Photography Essentials: Composition and Lighting",
    description: "Master the fundamental principles of great photography with practical exercises and expert feedback.",
    image: "https://picsum.photos/seed/explore5/800/450",
    authorName: "Visual Arts Hub",
    authorAvatar: "https://picsum.photos/seed/creator5/100/100",
    date: "1 week ago"
  },
  {
    id: 6,
    title: "Music Production: From Concept to Release",
    description: "A comprehensive guide to producing professional-quality music from your home studio.",
    image: "https://picsum.photos/seed/explore6/800/450",
    authorName: "Sound Collective",
    authorAvatar: "https://picsum.photos/seed/creator6/100/100",
    date: "2 weeks ago"
  }
];

// Placeholder creators
const exploreCreators = [
  {
    username: "gamecraft",
    full_name: "GameCraft Studio",
    avatar_url: "https://picsum.photos/seed/creator1/100/100",
    website: "https://gamecraft.example.com",
    bio: "Independent game development studio focusing on innovative gameplay mechanics and storytelling.",
    profile_completed: true
  },
  {
    username: "animation-central",
    full_name: "Animation Central",
    avatar_url: "https://picsum.photos/seed/creator2/100/100",
    website: "https://animationcentral.example.com",
    bio: "Animation tutorials, courses, and behind-the-scenes content from industry professionals.",
    profile_completed: true
  },
  {
    username: "narrative-nexus",
    full_name: "Narrative Nexus",
    avatar_url: "https://picsum.photos/seed/creator3/100/100",
    website: "https://narrativenexus.example.com",
    bio: "Helping writers and storytellers craft compelling narratives across different media.",
    profile_completed: true
  },
  {
    username: "tech-forward",
    full_name: "Tech Forward",
    avatar_url: "https://picsum.photos/seed/creator4/100/100",
    website: "https://techforward.example.com",
    bio: "Exploring the cutting edge of web development and digital technology.",
    profile_completed: true
  }
];

export default function Explore() {
  const { isChecking } = useAuthCheck();
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Partial<CreatorProfile>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simulate a data fetch
  useEffect(() => {
    if (isChecking) return;
    
    const timer = setTimeout(() => {
      setPosts(explorePosts);
      setCreators(exploreCreators);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isChecking]);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Filter content based on search query
  const filteredPosts = searchQuery 
    ? posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const filteredCreators = searchQuery
    ? creators.filter(creator => 
        creator.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : creators;
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Explore</h1>
          <p className="text-muted-foreground">Discover popular content and creators</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search content and creators..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="posts">Content</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <PostCard key={i} isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    description={post.description}
                    image={post.image}
                    authorName={post.authorName}
                    authorAvatar={post.authorAvatar}
                    date={post.date}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No content found matching your search.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="creators" className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <CreatorProfileCard key={i} creator={{}} isLoading={true} />
                ))}
              </div>
            ) : filteredCreators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCreators.map((creator, index) => (
                  <CreatorProfileCard key={index} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No creators found matching your search.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
