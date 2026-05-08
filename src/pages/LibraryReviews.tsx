import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LibraryTabs } from './Library';
import { useUserPurchases } from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryReviewsPage() {
  const { user } = useAuth();
  const { data: purchases } = useUserPurchases();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['user-reviews', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('creator_ratings')
        .select('*, creators(username, display_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const ratedCreatorIds = new Set((reviews ?? []).map((r: any) => r.creator_id));
  const toRate = (purchases ?? []).filter((p: any) => p.creator_id && !ratedCreatorIds.has(p.creator_id));

  return (
    <DashboardLayout>
      <div className="w-full">
        <h1 className="text-[20px] font-bold tracking-[-0.5px] mb-1">My Library</h1>
        <p className="text-[13px] text-[#888] mb-6">Ratings & Reviews</p>
        <LibraryTabs />

        <section className="mb-10">
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-3">Things to rate</h2>
          {toRate.length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {toRate.map((p: any, i: number) => (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3 ${i < toRate.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                  <div className="flex-1 min-w-0 text-[13px] font-semibold truncate">
                    {p.digital_products?.title ?? 'Asset'}
                  </div>
                  <span className="text-[11px] text-[#aaa]">Rate from creator's profile</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#aaa]">Nothing to rate.</p>
          )}
        </section>

        <section>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-3">Your reviews</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (reviews ?? []).length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {reviews!.map((r: any, i: number) => (
                <div key={r.id} className={`px-4 py-3 ${i < reviews!.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[13px] font-semibold">{r.creators?.display_name || r.creators?.username}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? 'fill-primary text-primary' : 'text-[#ddd]'}`} />
                      ))}
                    </div>
                  </div>
                  {r.review_text && <p className="text-[13px] text-[#555]">{r.review_text}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#aaa]">You haven't written any reviews yet.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
