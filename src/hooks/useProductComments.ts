import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_picture: string | null;
}

export interface ProductComment {
  id: string;
  product_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
}

export interface CommentThread {
  comment: ProductComment;
  replies: ProductComment[];
}

async function fetchAuthorProfiles(
  authorIds: string[]
): Promise<Map<string, CommentAuthor>> {
  const uniqueIds = [...new Set(authorIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const { data } = await supabase.rpc('get_public_user_profiles', {
    _user_ids: uniqueIds,
  });
  return new Map(
    ((data as CommentAuthor[]) ?? []).map((u) => [u.id, u])
  );
}

export function useProductComments(productId: string) {
  return useQuery({
    queryKey: ['product-comments', productId],
    enabled: !!productId,
    staleTime: 1000 * 30,
    queryFn: async (): Promise<ProductComment[]> => {
      const { data, error } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const authorsMap = await fetchAuthorProfiles(
        data.map((c) => c.author_id)
      );
      return data.map((c) => ({
        ...c,
        author: authorsMap.get(c.author_id) ?? null,
      })) as ProductComment[];
    },
  });
}

/** Groups a flat comment list into top-level threads with their replies. */
export function groupCommentThreads(comments: ProductComment[]): CommentThread[] {
  const topLevel = comments.filter((c) => c.parent_id === null);
  const repliesMap = new Map<string, ProductComment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const list = repliesMap.get(c.parent_id) ?? [];
      list.push(c);
      repliesMap.set(c.parent_id, list);
    }
  }
  return topLevel.map((c) => ({
    comment: c,
    replies: repliesMap.get(c.id) ?? [],
  }));
}

export function usePostComment(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('product_comments').insert({
        product_id: productId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}

export function useSoftDeleteComment(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('product_comments')
        .update({ is_deleted: true })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}
