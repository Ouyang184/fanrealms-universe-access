
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { CommissionDeliverable } from '@/types/commission';

export const useCommissionDeliverables = (commissionRequestId?: string) => {
  const queryClient = useQueryClient();

  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ['commission-deliverables', commissionRequestId],
    queryFn: async () => {
      if (!commissionRequestId) return [];
      
      const { data, error } = await supabase
        .from('commission_deliverables')
        .select('*')
        .eq('commission_request_id', commissionRequestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!commissionRequestId,
  });

  const createDeliverableMutation = useMutation({
    mutationFn: async ({ 
      commissionRequestId, 
      fileUrls, 
      deliveryNotes 
    }: { 
      commissionRequestId: string; 
      fileUrls: string[]; 
      deliveryNotes?: string;
    }) => {
      const { error } = await supabase
        .from('commission_deliverables')
        .insert({
          commission_request_id: commissionRequestId,
          file_urls: fileUrls,
          delivery_notes: deliveryNotes,
        });

      if (error) throw error;

      // Update commission status to delivered
      const { error: statusError } = await supabase
        .from('commission_requests')
        .update({ status: 'delivered' })
        .eq('id', commissionRequestId);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['commission-requests'] });
      toast({
        title: "Success",
        description: "Work submitted successfully!"
      });
    },
    onError: (error) => {
      console.error('Error submitting deliverable:', error);
      toast({
        title: "Error",
        description: "Failed to submit work",
        variant: "destructive"
      });
    },
  });

  const uploadFile = async (file: File, commissionRequestId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.id) throw new Error('Not authenticated');

    const filePath = `${user.id}/${commissionRequestId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('commission-deliverables')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      throw uploadError;
    }

    // Return the storage path (bucket is private). Consumers should create signed URLs when needed.
    return filePath;
  };

  const getSignedUrl = async (filePath: string, expiresInSeconds = 3600): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('commission-deliverables')
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    deliverables,
    isLoading,
    createDeliverable: createDeliverableMutation.mutate,
    isSubmitting: createDeliverableMutation.isPending,
    uploadFile,
    getSignedUrl,
  };
};
