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

export function useSocialLinks(creatorId: string | undefined) {
  const [isError, setIsError] = useState(false);

  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['creatorLinks', creatorId],
    queryFn: async () => {
      setIsError(false);
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from('creator_links')
        .select('*')
        .eq('creator_id', creatorId)
        .order('position', { ascending: true });

      if (error) {
        setIsError(true);
        return [];
      }

      return data as SocialLink[];
    },
    enabled: !!creatorId,
  });

  return { links, isLoading, isError, refetch };
}
