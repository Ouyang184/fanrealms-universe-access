import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  tags: string[];
  cover_image_url: string | null;
  website_url: string | null;
  repository_url: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface Devlog {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string | null;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function useCreatorProjects() {
  const { user } = useAuth();

  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['creator-projects', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!creatorProfile?.id
  });

  return { projects, isLoading, creatorProfile };
}

export function useProject(projectId?: string) {
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId
  });

  return { project, isLoading };
}

export function useProjectDevlogs(projectId?: string) {
  const { data: devlogs = [], isLoading } = useQuery({
    queryKey: ['devlogs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('devlogs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Devlog[];
    },
    enabled: !!projectId
  });

  return { devlogs, isLoading };
}

export function useCreateProject() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      tags?: string[];
      website_url?: string;
      repository_url?: string;
      status?: string;
      creator_id: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const slug = generateSlug(input.title) + '-' + Date.now().toString(36);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          creator_id: input.creator_id,
          title: input.title,
          slug,
          description: input.description || null,
          tags: input.tags || [],
          website_url: input.website_url || null,
          repository_url: input.repository_url || null,
          status: input.status || 'published',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      toast({ title: "Project created", description: "Your project has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ['creator-projects'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateDevlog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      content: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('devlogs')
        .insert({
          project_id: input.project_id,
          author_id: user.id,
          title: input.title,
          content: input.content,
          tags: input.tags || [],
          status: 'published',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Devlog;
    },
    onSuccess: (data) => {
      toast({ title: "Devlog posted", description: "Your devlog has been published." });
      queryClient.invalidateQueries({ queryKey: ['devlogs', data.project_id] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProject() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Project deleted" });
      queryClient.invalidateQueries({ queryKey: ['creator-projects'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
