
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ChevronLeft,
  Check,
  SlidersHorizontal,
  Palette,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { TagFilter } from "@/components/tags/TagFilter";

interface CommissionType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  estimated_turnaround_days: number;
  sample_art_url?: string;
  created_at: string;
  creator: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    user_id: string;
  };
}

type SortOption = "newest" | "price-low" | "price-high" | "fastest" | "most-popular";

export default function AllCommissionsPage() {
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    document.title = "All Commissions | FanRealms";
  }, []);

  // Fetch all commission types
  const { data: allCommissions = [], isLoading } = useQuery({
    queryKey: ['all-commissions-page'],
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all commissions:', error);
        return [];
      }

      return data || [];
    },
  });

  // Apply filtering and sorting
  const applyFilters = (commissions: CommissionType[]) => {
    if (!commissions || commissions.length === 0) return [];
    
    let result = [...commissions];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(commission => 
        commission.name.toLowerCase().includes(query) ||
        commission.description?.toLowerCase().includes(query) ||
        commission.creator.display_name.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      const lowerTags = selectedTags.map(t => t.toLowerCase());
      result = result.filter(commission => {
        const haystack = `${commission.name} ${commission.description || ''} ${commission.creator.display_name}`.toLowerCase();
        return lowerTags.some(tag => haystack.includes(tag));
      });
    }
    
    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price-low":
        result.sort((a, b) => a.base_price - b.base_price);
        break;
      case "price-high":
        result.sort((a, b) => b.base_price - a.base_price);
        break;
      case "fastest":
        result.sort((a, b) => a.estimated_turnaround_days - b.estimated_turnaround_days);
        break;
      case "most-popular":
        // For now, sort by creator display name as popularity metric
        result.sort((a, b) => a.creator.display_name.localeCompare(b.creator.display_name));
        break;
    }
    
    return result;
  };

  const displayCommissions = applyFilters(allCommissions);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "newest": return "Newest";
      case "price-low": return "Price: Low to High";
      case "price-high": return "Price: High to Low";
      case "fastest": return "Fastest Delivery";
      case "most-popular": return "Most Popular";
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Hero Section */}
        <section className="mb-6 sm:mb-8">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-purple-900 to-blue-900"></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 sm:p-6 md:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">
                All Commissions
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-gray-200 max-w-2xl mb-4 sm:mb-6 leading-relaxed">
                Discover custom artwork and commissions from talented creators
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for commission types, creators, or services..."
                    className="pl-10 bg-gray-900/80 border-gray-700 focus-visible:ring-purple-500 w-full text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Explore Button */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-end">
            <Button variant="outline" className="gap-2 text-sm" onClick={() => navigate('/explore')}>
              <ChevronLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </div>
        </section>

        {/* Filtering and Sorting */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/50 p-3 sm:p-4 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center">
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-400" />
                <span className="mr-3 font-medium text-sm sm:text-base">Filters:</span>
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search commissions..."
                  className="pl-8"
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Sort: {getSortLabel(sortOption)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={() => setSortOption("newest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Newest</span>
                  {sortOption === "newest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-low")} className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Price: Low to High</span>
                  {sortOption === "price-low" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-high")} className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Price: High to Low</span>
                  {sortOption === "price-high" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("fastest")} className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Fastest Delivery</span>
                  {sortOption === "fastest" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("most-popular")} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Most Popular</span>
                  {sortOption === "most-popular" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        <section className="mb-6 sm:mb-8">
          <TagFilter selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </section>

        {/* Commissions Grid */}
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              {isLoading 
                ? "Loading commissions..." 
                : `${displayCommissions.length} Commission Types`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : displayCommissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayCommissions.map((commission) => (
                <Card key={commission.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage 
                          src={commission.creator.profile_image_url} 
                          alt={commission.creator.display_name}
                        />
                        <AvatarFallback>
                          <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{commission.creator.display_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          Creator
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg">{commission.name}</CardTitle>
                    {commission.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {commission.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sample Art */}
                    {commission.sample_art_url ? (
                      <div className="relative">
                        <img
                          src={commission.sample_art_url}
                          alt={`Sample art for ${commission.name}`}
                          className="w-full h-28 sm:h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/70 text-white border-0 text-xs">
                            Sample
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 sm:h-32 bg-muted rounded-lg border flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Palette className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm">No sample available</p>
                        </div>
                      </div>
                    )}

                    {/* Commission Details */}
                    <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        <span className="font-medium">${commission.base_price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        <span>{commission.estimated_turnaround_days} days</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link to={`/creator/${commission.creator.id}?tab=commissions`}>
                      <Button className="w-full text-xs sm:text-sm" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
              <h3 className="text-lg sm:text-xl font-medium mb-2">No commissions found</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? "We couldn't find any commissions matching your search. Try different keywords."
                  : "No commission types are currently available. Check back soon!"}
              </p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
