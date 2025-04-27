
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { ContentCardSkeleton } from "@/components/ContentCardSkeleton";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";

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

export default function Explore() {
  const { isChecking } = useAuthCheck();
  const [posts, setPosts] = useState<typeof explorePosts>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulate a data fetch
  useEffect(() => {
    if (isChecking) return;
    
    const timer = setTimeout(() => {
      setPosts(explorePosts);
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
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Explore Creators</h1>
          <p className="text-muted-foreground">Discover popular and trending content</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <ContentCardSkeleton />
              <ContentCardSkeleton />
              <ContentCardSkeleton />
              <ContentCardSkeleton />
              <ContentCardSkeleton />
              <ContentCardSkeleton />
            </>
          ) : (
            posts.map((post) => (
              <ContentCard 
                key={post.id}
                title={post.title}
                description={post.description}
                image={post.image}
                authorName={post.authorName}
                authorAvatar={post.authorAvatar}
                date={post.date}
              />
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
