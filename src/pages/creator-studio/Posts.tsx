import { useState } from "react";
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: 'Getting Started with FanRealms', tier: null, created_at: '2025-04-15T12:00:00Z' },
    { id: '2', title: 'Exclusive Content for Supporters', tier: 'Premium', created_at: '2025-04-18T15:30:00Z' },
    { id: '3', title: 'Behind the Scenes', tier: 'VIP', created_at: '2025-04-20T09:45:00Z' },
    { id: '4', title: 'Weekly Update', tier: null, created_at: '2025-04-22T14:20:00Z' },
    { id: '5', title: 'Q&A Session Announcement', tier: null, created_at: '2025-04-25T11:10:00Z' },
  ]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function handleCreatePost() {
    toast({
      title: "Coming Soon",
      description: "The post creation feature is currently being developed."
    });
  }

  function handleEditPost(id: string) {
    toast({
      title: "Edit Post",
      description: `Editing post with ID: ${id}`
    });
  }

  function handleDeletePost(id: string) {
    toast({
      description: `Post with ID: ${id} has been removed.`,
      variant: "destructive"
    });
    
    setPosts(posts.filter(post => post.id !== id));
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
            {posts.length > 0 ? (
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
                  {isLoading ? 'Loading posts...' : 'No posts found. Create your first post!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
