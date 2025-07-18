import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Clock, DollarSign, Star, ArrowRight } from "lucide-react";
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

// Separate component to handle the rating logic
function CommissionCard({ commission }: { commission: CommissionType }) {
  const { stats } = useCreatorRatingStats([commission.creator.id]);
  const ratingStats = stats[commission.creator.id];

  return (
    <Card className="hover:shadow-lg transition-shadow group overflow-hidden">
      {/* Sample Art at the top */}
      {commission.sample_art_url ? (
        <div className="relative overflow-hidden">
          <img
            src={commission.sample_art_url}
            alt={`Sample art for ${commission.name}`}
            className="w-full h-40 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-500 text-white border-0 text-xs font-medium px-2 py-1">
              Sample
            </Badge>
          </div>
        </div>
      ) : (
        <div className="w-full h-40 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Palette className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No sample available</p>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {commission.creator.profile_image_url ? (
              <img
                src={commission.creator.profile_image_url}
                alt={commission.creator.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Palette className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{commission.creator.display_name}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Creator
              </Badge>
              {ratingStats && ratingStats.total_ratings > 0 && (
                <CreatorRatingDisplay 
                  rating={ratingStats.average_rating}
                  count={ratingStats.total_ratings}
                  size="sm" 
                />
              )}
            </div>
          </div>
        </div>
        <CardTitle className="text-lg">{commission.name}</CardTitle>
        {commission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {commission.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Commission Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 px-2 py-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">{commission.base_price}</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>{commission.estimated_turnaround_days} days</span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/creator/${commission.creator.id}?tab=commissions`}>
          <Button className="w-full" size="sm">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function CommissionSection() {
  const { data: featuredCommissions = [], isLoading } = useQuery({
    queryKey: ['featured-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_types')
        .select(`
          *,
          creator:creators!inner(
            id,
            display_name,
            profile_image_url,
            user_id,
            accepts_commissions
          )
        `)
        .eq('is_active', true)
        .eq('creators.accepts_commissions', true)
        .order('base_price')
        .limit(6);

      if (error) {
        console.error('Error fetching featured commissions:', error);
        return [];
      }

      // Debug: Check profile images
      console.log('Commission data with profile images:', data?.map(c => ({
        name: c.name,
        creator: c.creator.display_name,
        profileImage: c.creator.profile_image_url
      })));

      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12">
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (featuredCommissions.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Commissions</h2>
          <p className="text-muted-foreground">
            Get custom artwork from talented creators
          </p>
        </div>
        <Link to="/commissions" className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredCommissions.map((commission) => (
          <CommissionCard key={commission.id} commission={commission} />
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="flex justify-center mt-6 sm:hidden">
        <Link to="/commissions" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          View All Commissions <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}