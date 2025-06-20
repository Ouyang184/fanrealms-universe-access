
import { useState } from "react";
import {
  Search,
  Calendar,
  FileText,
  ImageIcon,
  Video,
  Music,
  MoreHorizontal,
  Plus,
  EyeOff,
  Clock,
  Edit,
  Copy,
  Trash,
  ChevronDown,
  Star,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Loader,
  Lock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useCreatorPosts, PostFilter } from "@/hooks/useCreatorPosts";
import { CreatorPost } from "@/types/creator-studio";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CreatePostForm } from "@/components/creator-studio/CreatePostForm";
import { EditPostDialog } from "@/components/creator-studio/EditPostDialog";
import { useDeletePost } from "@/hooks/useDeletePost";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePostViews } from "@/hooks/usePostViews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SortOption = "newest" | "oldest" | "most-viewed";

export default function CreatorPostsPage() {
  const { 
    posts, 
    isLoading, 
    filter, 
    searchQuery, 
    showDrafts, 
    handleSearch, 
    toggleShowDrafts, 
    handleFilterChange 
  } = useCreatorPosts();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Filter posts based on filter tab and apply sorting
  const getFilteredPosts = () => {
    let filteredPosts = filter === "all" ? posts : posts.filter(post => post.type === filter);
    
    // Apply sorting
    return [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most-viewed":
          const aViews = a.engagement?.views || 0;
          const bViews = b.engagement?.views || 0;
          return bViews - aViews;
        default:
          return 0;
      }
    });
  };

  const filteredPosts = getFilteredPosts();

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "newest":
        return "Newest first";
      case "oldest":
        return "Oldest first";
      case "most-viewed":
        return "Most viewed";
      default:
        return "Sort by";
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground mt-1">Create and manage your content</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CreatePostForm />
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Content Calendar
            </Button>
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <span>{getSortLabel(sortBy)}</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("most-viewed")}>
                  Most viewed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue={filter} className="space-y-6" onValueChange={(value) => handleFilterChange(value as PostFilter)}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">
                All Posts
              </TabsTrigger>
              <TabsTrigger value="article">
                <FileText className="h-4 w-4 mr-2" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show draft posts</span>
              <Switch id="show-drafts" checked={showDrafts} onCheckedChange={toggleShowDrafts} />
            </div>
          </div>

          {/* Content for all tabs */}
          {["all", "article", "image", "video"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {isLoading ? (
                // Loading state
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-52" />
                          <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2 mt-3">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-0">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </CardFooter>
                  </Card>
                ))
              ) : filteredPosts.length === 0 ? (
                // Empty state
                <Card className="bg-card py-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      {tabValue === "all" || tabValue === "article" ? (
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      ) : tabValue === "image" ? (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <Video className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No posts found</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      {searchQuery 
                        ? "No posts match your search. Try different keywords or clear filters."
                        : `You haven't created any ${tabValue === "all" ? "" : tabValue} posts yet.`
                      }
                    </p>
                    <div className="mt-6">
                      <CreatePostForm />
                    </div>
                  </div>
                </Card>
              ) : (
                // Posts list
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Content Calendar Preview */}
        {posts.length > 0 && !isLoading && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Calendar</CardTitle>
                <CardDescription>Upcoming scheduled posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {posts
                  .filter(post => post.status === "scheduled")
                  .slice(0, 3)
                  .map(post => (
                    <div key={post.id} className="flex items-center space-x-4">
                      <CalendarDays className="h-8 w-8 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">
                          {post.scheduleDate ? format(new Date(post.scheduleDate), "MMMM d, yyyy - h:mm a") : "Scheduled"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{post.title}</p>
                      </div>
                    </div>
                  ))}
                
                {posts.filter(post => post.status === "scheduled").length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No scheduled posts yet. Use the calendar feature to plan your content.
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Full Calendar
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Post Card Component with CREATOR-CENTRIC ACCESS LOGIC
function PostCard({ post }: { post: CreatorPost }) {
  const navigate = useNavigate();
  const { deletePost, isDeleting } = useDeletePost();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const { viewCount } = usePostViews(post.id); // Add view count hook
  
  // CREATOR-CENTRIC ACCESS LOGIC: Creators ALWAYS have full access to their own posts
  const isOwnPost = !!(user?.id && post.authorId && String(user.id) === String(post.authorId));
  const isPremiumPost = !!post.tier_id;
  
  // CREATOR ALWAYS HAS FULL ACCESS - this matches the logic from PostCard.tsx
  const hasFullAccess = isOwnPost || !isPremiumPost;
  
  console.log('[Creator Studio PostCard] ENHANCED Creator access check:', {
    postId: post.id,
    postTitle: post.title,
    tierId: post.tier_id,
    authorId: post.authorId,
    userId: user?.id,
    isOwnPost,
    isPremiumPost,
    hasFullAccess,
    finalDecision: hasFullAccess ? 'FULL_ACCESS_GRANTED' : 'ACCESS_RESTRICTED'
  });
  
  const handleEditPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleDeletePost = () => {
    console.log('Delete button clicked for post:', post.id);
    if (!post.id) {
      console.error('No post ID provided');
      return;
    }
    deletePost(post.id);
  };

  const handlePublishPost = async () => {
    if (!post.id) {
      console.error('No post ID provided');
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          title: post.title.replace(/\bdraft\b/gi, '').trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Post published",
        description: "Your post has been published successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  const getStatusBadgeStyles = (status: string) => {
    switch(status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };
  
  const getContentIcon = () => {
    switch(post.type) {
      case "article":
        return <FileText className="h-3 w-3 mr-1" />;
      case "image":
        return <ImageIcon className="h-3 w-3 mr-1" />;
      case "video":
        return <Video className="h-3 w-3 mr-1" />;
      case "audio":
        return <Music className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <>
      <Card className={isPremiumPost && !hasFullAccess ? "border-amber-200 bg-amber-50/30" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isPremiumPost && <Lock className="h-4 w-4 text-amber-600" />}
                {post.title}
                {/* Creator's own premium content indicator */}
                {isPremiumPost && hasFullAccess && isOwnPost && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 ml-2">
                    Your Premium Content
                  </Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={getStatusBadgeStyles(post.status)}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </Badge>
                {post.status === "scheduled" ? (
                  <span>{post.scheduleDate ? format(new Date(post.scheduleDate), "MMMM d, yyyy") : "Scheduled"}</span>
                ) : (
                  <span>{post.date}</span>
                )}
                <span>•</span>
                <span className="flex items-center">
                  {getContentIcon()}
                  {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                </span>
                {post.tier_id && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      {post.availableTiers?.length ? post.availableTiers[0].name : 'Premium'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2" onClick={handleEditPost}>
                  <Edit className="h-4 w-4" /> Edit post
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" /> Change visibility
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Copy className="h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post
                        and remove all associated comments and likes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePost}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-muted-foreground line-clamp-2">
            {post.content}
          </p>
          {isPremiumPost && hasFullAccess && isOwnPost && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                This is your premium content. Subscribers with access to this tier can view the full post.
              </p>
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="hover:bg-secondary/80">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            {post.status === "published" && (
              <>
                <div className="flex items-center mr-4">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{viewCount}</span>
                </div>
                <div className="flex items-center mr-4">
                  <Star className="h-4 w-4 mr-1" />
                  <span>{post.engagement?.likes || 0}</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{post.engagement?.comments || 0}</span>
                </div>
              </>
            )}
            {post.status === "scheduled" && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Publishes on {post.scheduleDate ? format(new Date(post.scheduleDate), "MMM d") : "scheduled date"}</span>
              </div>
            )}
            {post.status === "draft" && (
              <div className="flex items-center">
                <Edit className="h-4 w-4 mr-1" />
                <span>Last edited {post.lastEdited}</span>
              </div>
            )}
          </div>
          {post.availableTiers && post.availableTiers.length > 0 ? (
            <div className="flex items-center">
              <div className="text-xs text-muted-foreground mr-2">Available to:</div>
              {post.availableTiers.map((tier) => (
                <Badge 
                  key={tier.id} 
                  className={`bg-${tier.color}-100 text-${tier.color}-800 dark:bg-${tier.color}-900/40 dark:text-${tier.color}-300 ml-1`}
                >
                  {tier.name}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="secondary">Public</Badge>
          )}
        </CardFooter>
        
        {post.status === "draft" && (
          <CardFooter className="pt-0">
            <Button variant="outline" className="mr-2" onClick={handleEditPost}>
              <Edit className="h-4 w-4 mr-2" />
              Continue Editing
            </Button>
            <Button onClick={handlePublishPost} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <EditPostDialog 
        post={post}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
