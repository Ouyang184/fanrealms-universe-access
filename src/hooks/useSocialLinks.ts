
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
    refetch,
    isFetching
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
          .eq('creator_id', creatorId)
          .order('position', { ascending: true });
        
        if (error) {
          console.error('Error fetching social links:', error);
          setIsError(true);
          toast({
            title: "Error",
            description: "Failed to load social links",
            variant: "destructive"
          });
          return [];
        }
        
        console.log(`Found ${data?.length || 0} social links for creator ${creatorId}:`, data);
        return data as SocialLink[];
      } catch (error) {
        console.error('Error in useSocialLinks:', error);
        setIsError(true);
        toast({
          title: "Error",
          description: "Something went wrong while loading social links",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!creatorId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false
  });

  return {
    links,
    isLoading: isLoading || isFetching,
    isError,
    refetch
  };
}
