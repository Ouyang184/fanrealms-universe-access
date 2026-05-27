import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const JOB_CATEGORIES = [
  'Game Dev',
  'iOS',
  'Web',
  'Design',
  'Other',
] as const;

export function useJobListings(category?: string) {
  return useQuery({
    queryKey: ['job-listings', category],
    queryFn: async () => {
      // Exclude contact_info — anon role no longer has column-level SELECT on it
      let query = supabase
        .from('job_listings')
        .select('id,title,description,requirements,category,budget_min,budget_max,budget_type,tags,deadline,status,poster_id,created_at,updated_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useJobListing(jobId: string) {
  return useQuery({
    queryKey: ['job-listing', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      // Check session first — anon can't read contact_info, so we conditionally include it
      const { data: { session } } = await supabase.auth.getSession();
      const columns = session
        ? '*'
        : 'id,title,description,requirements,category,budget_min,budget_max,budget_type,tags,deadline,status,poster_id,created_at,updated_at';

      const { data, error } = await supabase
        .from('job_listings')
        .select(columns)
        .eq('id', jobId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Use SECURITY DEFINER RPC — users table RLS only allows reading own row
      const { data: profiles } = await supabase
        .rpc('get_public_user_profiles', { _user_ids: [(data as any).poster_id] });
      const userData = (profiles as any[])?.[0] ?? null;
      return { ...(data as any), users: userData };
    },
  });
}

export function useCreateJobListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (listing: {
      title: string;
      description?: string;
      requirements?: string;
      category: string;
      budget_min?: number;
      budget_max?: number;
      budget_type?: string;
      tags?: string[];
      deadline?: string;
      contact_info?: string;
    }) => {
      const { data, error } = await supabase
        .from('job_listings')
        .insert({ ...listing, poster_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-listings'] });
    },
    onError: (error) => {
      toast.error('Failed to create listing: ' + error.message);
    },
  });
}

export function useJobApplications(listingId: string) {
  return useQuery({
    queryKey: ['job-applications', listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch applicant profiles via SECURITY DEFINER RPC (users table RLS blocks direct reads)
      const applicantIds = [...new Set(data.map((a: any) => a.applicant_id))];
      const { data: profiles } = await supabase
        .rpc('get_public_user_profiles', { _user_ids: applicantIds });

      const profileMap = new Map(
        ((profiles as any[]) ?? []).map((p: any) => [p.id, p])
      );

      return data.map((app: any) => ({
        ...app,
        applicant: profileMap.get(app.applicant_id) ?? null,
      }));
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, listingId, status }: { applicationId: string; listingId: string; status: string }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', variables.listingId] });
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (application: {
      listing_id: string;
      cover_letter?: string;
      portfolio_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .insert({ ...application, applicant_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', variables.listing_id] });
      toast.success('Application submitted!');
    },
    onError: (error) => {
      toast.error('Failed to apply: ' + error.message);
    },
  });
}
