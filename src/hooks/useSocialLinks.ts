
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface SocialLink {
  id: string;
  creator_id: string;
  label: string | null;
  url: string;
  position: number | null;
}

export function useSocialLinks(creatorId: string | undefined) {
  const [isError, setIsError] = useState(false);

  // Add logging for better debugging
  useEffect(() => {
    console.log(`useSocialLinks initialized with creatorId: ${creatorId}`);
  }, [creatorId]);

  const { 
    data: links = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['creatorLinks', creatorId],
    queryFn: async () => {
      setIsError(false);
      
      if (!creatorId) {
        console.log("No creator ID provided to useSocialLinks");
        return [];
      }
      
      console.log(`Fetching social links for creator ID: ${creatorId}`);
      
      try {
        const { data, error } = await supabase
          .from('creator_links')
          .select('*')
          .eq('creator_id', creatorId as any)
          .order('position', { ascending: true });
        
        if (error) {
          console.error('Error fetching social links:', error);
          setIsError(true);
          return [];
        }
        
        console.log(`Found ${data?.length || 0} social links for creator ${creatorId}:`, data);
        return (data as any) as SocialLink[];
      } catch (error) {
        console.error('Error in useSocialLinks:', error);
        setIsError(true);
        return [];
      }
    },
    enabled: !!creatorId
  });

  return {
    links,
    isLoading,
    isError,
    refetch
  };
}
