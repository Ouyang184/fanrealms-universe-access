import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LibraryTabs } from './Library';
import { useUserPurchases } from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Inline star picker ────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className={`w-7 h-7 flex items-center justify-center text-[18px] transition-colors ${
            n <= (hovered || value) ? 'text-yellow-400' : 'text-[#ddd]'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Star display (read-only) ──────────────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-[#ddd]'}`}
        />
      ))}
    </div>
  );
}

// ── Rate-a-product row ────────────────────────────────────────────────────────

function RateRow({ purchase }: { purchase: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [expanded, setExpanded] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('product_ratings')
        .upsert(
          { product_id: purchase.product_id, user_id: user.id, rating, review: review.trim() || null },
          { onConflict: 'product_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rating saved');
      queryClient.invalidateQueries({ queryKey: ['my-product-ratings', user?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const product = purchase.digital_products;
  const title = product?.title ?? 'Unknown asset';
  const cover = product?.cover_image_url ?? null;

  return (
    <div className="px-4 py-3 border-b border-[#f5f5f5] last:border-0">
      <div className="flex items-center gap-3">
        {cover ? (
          <img src={cover} alt={title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-[#f0f0f0] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate">{title}</p>
          <StarPicker value={rating} onChange={(v) => { setRating(v); setExpanded(true); }} />
        </div>
      </div>

      {expanded && rating > 0 && (
        <div className="mt-2 pl-[52px] space-y-2">
          <textarea
            rows={2}
            placeholder="Add a review (optional)"
            value={review}
            onChange={e => setReview(e.target.value)}
            maxLength={400}
            className="w-full text-[12px] border border-[#eee] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="px-3 py-1.5 text-[12px] font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submit.isPending ? 'Saving…' : 'Submit rating'}
            </button>
            <button
              type="button"
              onClick={() => { setRating(0); setReview(''); setExpanded(false); }}
              className="px-3 py-1.5 text-[12px] font-semibold text-[#888] hover:text-[#111] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LibraryReviewsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: purchases, isLoading: purchasesLoading } = useUserPurchases();

  // All product ratings the current user has left
  const { data: myRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['my-product-ratings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ratings')
        .select('*, digital_products(id, title, cover_image_url)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteRating = useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase
        .from('product_ratings')
        .delete()
        .eq('id', ratingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rating removed');
      queryClient.invalidateQueries({ queryKey: ['my-product-ratings', user?.id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const ratedProductIds = new Set((myRatings ?? []).map((r: any) => r.product_id));
  const toRate = (purchases ?? []).filter(
    (p: any) => p.product_id && !ratedProductIds.has(p.product_id)
  );

  const isLoading = purchasesLoading || ratingsLoading;

  return (
    <DashboardLayout>
      <div className="w-full">
        <h1 className="text-[20px] font-bold tracking-[-0.5px] mb-1">My Library</h1>
        <p className="text-[13px] text-[#888] mb-6">Ratings & Reviews</p>
        <LibraryTabs />

        {/* To rate */}
        <section className="mb-10">
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-3">Rate your purchases</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : toRate.length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {toRate.map((p: any) => (
                <RateRow key={p.id} purchase={p} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#aaa]">
              {(purchases ?? []).length === 0
                ? "You haven't purchased any assets yet."
                : "You've rated all your purchases — nice!"}
            </p>
          )}
        </section>

        {/* Existing reviews */}
        <section>
          <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-3">Your reviews</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (myRatings ?? []).length > 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {(myRatings ?? []).map((r: any, i: number) => {
                const product = r.digital_products;
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 px-4 py-3 ${i < myRatings!.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
                  >
                    {product?.cover_image_url ? (
                      <img src={product.cover_image_url} alt={product.title} className="w-10 h-10 rounded object-cover flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#f0f0f0] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold truncate">
                          {product?.title ?? 'Unknown asset'}
                        </p>
                        <StarDisplay value={r.rating} />
                      </div>
                      {r.review && (
                        <p className="text-[12px] text-[#555] leading-relaxed">{r.review}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRating.mutate(r.id)}
                      disabled={deleteRating.isPending}
                      className="p-1.5 text-[#ccc] hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Remove rating"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-[#aaa]">You haven't reviewed any assets yet.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
