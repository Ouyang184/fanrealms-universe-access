import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useJobListings, JOB_CATEGORIES } from '@/hooks/useJobs';
import { JobListingCard } from '@/components/jobs/JobListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateJobDialog } from '@/components/jobs/CreateJobDialog';

export default function Jobs() {
  const [category, setCategory] = useState('all');
  const { data: listings, isLoading } = useJobListings(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Jobs</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Find gigs, bounties, and freelance opportunities</p>
          </div>
          <CreateJobDialog />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
              category === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
            }`}
          >
            All
          </button>
          {JOB_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {listings.map((listing, i) => (
              <JobListingCard
                key={listing.id}
                listing={listing}
                isLast={i === listings.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No open listings. Be the first to post a job!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
