
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/PostCard";
import { ContentCardSkeleton } from "@/components/ContentCardSkeleton";

export function HomeContent() {
  const { data: posts, isLoading } = usePosts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">No posts yet</h2>
        <p className="text-gray-600">Check back later for new content from creators!</p>
      </div>
    );
  }

  console.log('HomeContent rendering posts:', posts.length, 'posts including tier-restricted');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            content={post.content}
            authorName={post.authorName}
            authorAvatar={post.authorAvatar}
            createdAt={post.createdAt}
            date={post.date || post.createdAt}
            tier_id={post.tier_id}
            attachments={post.attachments}
            authorId={post.authorId}
          />
        ))}
      </div>
    </div>
  );
}
