
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SocialLink {
  id: string;
  creator_id: string;
  label: string | null;
  url: string;
  position: number | null;
}

export function useSocialLinks(creatorId: string) {
  const [isError, setIsError] = useState(false);

  const { 
    data: links = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['creatorLinks', creatorId],
    queryFn: async () => {
      setIsError(false);
      
      if (!creatorId) return [];
      
      try {
        const { data, error } = await supabase
          .from('creator_links')
          .select('*')
          .eq('creator_id', creatorId)
          .order('position', { ascending: true });
        
        if (error) {
          console.error('Error fetching social links:', error);
          setIsError(true);
          return [];
        }
        
        return data as SocialLink[];
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
