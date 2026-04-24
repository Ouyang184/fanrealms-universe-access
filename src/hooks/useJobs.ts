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
      let query = supabase
        .from('job_listings')
        .select('*')
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
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (data) {
        const { data: userData } = await supabase
          .from('users')
          .select('username, profile_picture')
          .eq('id', data.poster_id)
          .single();
        return { ...data, users: userData };
      }
      return data;
      return data;
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
      toast.success('Job listing created');
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
      return data;
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
      toast.success('Application submitted');
    },
    onError: (error) => {
      toast.error('Failed to apply: ' + error.message);
    },
  });
}
