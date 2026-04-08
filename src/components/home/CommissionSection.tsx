import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Clock, DollarSign, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreatorRatingDisplay } from "@/components/ratings/CreatorRatingDisplay";
import { useCreatorRatingStats } from "@/hooks/useCreatorRatingStats";

interface CommissionType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_turnaround_days: number;
  sample_art_url?: string;
  creator: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    user_id: string;
  };
}

function CommissionCard({ commission }: { commission: CommissionType }) {
  const { stats } = useCreatorRatingStats([commission.creator.id]);
  const ratingStats = stats[commission.creator.id];

  return (
    <Card className="overflow-hidden hover:border-foreground/20 transition-colors">
      {commission.sample_art_url ? (
        <div className="relative overflow-hidden">
          <img
            src={commission.sample_art_url}
            alt={`Sample for ${commission.name}`}
            className="w-full h-40 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-muted flex items-center justify-center">
          <Palette className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {commission.creator.profile_image_url ? (
              <img src={commission.creator.profile_image_url} alt={commission.creator.display_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium">{commission.creator.display_name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{commission.creator.display_name}</p>
            {ratingStats && ratingStats.total_ratings > 0 && (
              <CreatorRatingDisplay rating={ratingStats.average_rating} count={ratingStats.total_ratings} size="sm" />
            )}
          </div>
        </div>
        <CardTitle className="text-base">{commission.name}</CardTitle>
        {commission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{commission.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />{commission.base_price}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />{commission.estimated_turnaround_days}d
          </span>
        </div>
        <Link to={`/creator/${commission.creator.id}?tab=commissions`}>
          <Button variant="outline" className="w-full" size="sm">View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function CommissionSection({ showSearch = false, initialQuery = "" }: { showSearch?: boolean; initialQuery?: string }) {
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: featuredCommissions = [], isLoading } = useQuery({
    queryKey: ['featured-commissions', debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('commission_types')
        .select(`*, creator:creators!inner(id, display_name, profile_image_url, user_id, accepts_commissions)`)
        .eq('is_active', true)
        .eq('creators.accepts_commissions', true);

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query.order('base_price').limit(6);
      if (error) return [];
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      </section>
    );
  }

  if (featuredCommissions.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Commissions</h2>
          <p className="text-sm text-muted-foreground mt-1">Custom work from talented creators</p>
        </div>
        <div className="flex items-center gap-3">
          {showSearch && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 w-48" />
            </div>
          )}
          <Link to="/commissions">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredCommissions.map((commission) => (
          <CommissionCard key={commission.id} commission={commission} />
        ))}
      </div>
    </section>
  );
}
