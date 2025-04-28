
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, Trash } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CreatePostForm } from "@/components/creator-studio/CreatePostForm";

interface Post {
  id: string;
  title: string;
  tier: string | null;
  created_at: string;
}

export default function CreatorStudioPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Fetch posts from Supabase
  const { 
    data: posts = [], 
    isLoading,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ["userPosts"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, 
          title, 
          created_at,
          tier_id,
          membership_tiers(title)
        `)
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return [];
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        tier: post.membership_tiers?.title || null,
        created_at: post.created_at
      }));
    },
    enabled: !!user
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function handleEditPost(id: string) {
    toast({
      title: "Edit Post",
      description: `Editing post with ID: ${id}`
    });
  }

  async function handleDeletePost(id: string) {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        description: "Post has been removed."
      });
      
      // Refresh posts list
      refetchPosts();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        <CreatePostForm />
      </div>
      
      <Card>
        <Table>
          <TableCaption>A list of your posts</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.tier || 'Public'}</TableCell>
                  <TableCell>{formatDate(post.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEditPost(post.id)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePost(post.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No posts found. Create your first post!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
