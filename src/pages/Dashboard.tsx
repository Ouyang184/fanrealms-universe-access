
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import PostCard from "@/components/PostCard";
import { Post } from "@/types";

// Placeholder data for the feed
const placeholderPosts = [
  {
    id: 1,
    title: "Getting Started with Digital Art: Essential Tools and Techniques",
    description: "In this comprehensive guide, I'll walk you through everything you need to know about getting started with digital art, from choosing the right tablet to mastering essential techniques used by professionals.",
    image: "https://picsum.photos/seed/post1/800/450",
    authorName: "Creative Studio",
    authorAvatar: "https://picsum.photos/seed/avatar1/100/100",
    date: "2 days ago"
  },
  {
    id: 2,
    title: "Building a Sustainable Content Creation Strategy for 2025",
    description: "Learn how to create content that resonates with your audience while maintaining a sustainable creation schedule. This post covers planning, production techniques, and audience engagement strategies.",
    image: "https://picsum.photos/seed/post2/800/450",
    authorName: "Content Masters",
    authorAvatar: "https://picsum.photos/seed/avatar2/100/100",
    date: "4 days ago"
  },
  {
    id: 3,
    title: "Behind the Scenes: Creating My Latest Animation Series",
    description: "Take a look at my creative process, from initial concept sketches to final rendering. I share tips, challenges faced, and solutions that helped me complete this project on time.",
    image: "https://picsum.photos/seed/post3/800/450",
    authorName: "Animation Pro",
    authorAvatar: "https://picsum.photos/seed/avatar3/100/100",
    date: "1 week ago"
  },
  {
    id: 4,
    title: "Monthly Q&A: Your Questions About Game Development Answered",
    description: "In this month's Q&A session, I address the most common questions from my community about game development, programming challenges, and career advice for aspiring developers.",
    image: "https://picsum.photos/seed/post4/800/450",
    authorName: "Game Dev",
    authorAvatar: "https://picsum.photos/seed/avatar4/100/100",
    date: "2 weeks ago"
  }
];

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulate a data fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(placeholderPosts);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <MainLayout showTabs={true}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Your Feed</h1>
          <p className="text-muted-foreground">Latest updates from creators you follow</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <>
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
              <PostCard isLoading={true} id={0} title="" description="" image="" authorName="" authorAvatar="" date="" />
            </>
          ) : (
            posts.map((post) => (
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
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
