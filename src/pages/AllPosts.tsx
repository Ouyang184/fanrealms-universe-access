import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ContentItem } from "@/components/explore/ContentItem";
import { Post } from "@/types";
import { PostPreviewModal } from "@/components/explore/PostPreviewModal";

export default function AllPostsPage() {
  const { data: posts = [], isLoading } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    document.title = "All Posts | FanRealms";
    const desc = "Browse all public posts from creators";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', desc);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <section className="mb-8">
          <h1 className="text-3xl font-bold">All Posts</h1>
          <p className="text-muted-foreground mt-1">{posts.length} posts</p>
        </section>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {posts.map((post) => (
              <div key={post.id} onClick={() => handlePostClick(post)} className="cursor-pointer">
                <ContentItem post={post} type="trending" onPostClick={handlePostClick} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg">
            <p className="text-lg font-medium">No posts found</p>
            <p className="text-muted-foreground">Check back later for new content.</p>
          </div>
        )}

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
