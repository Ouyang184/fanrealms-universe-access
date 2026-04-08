import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useJobListings, JOB_CATEGORIES } from '@/hooks/useJobs';
import { JobListingCard } from '@/components/jobs/JobListingCard';
import { CreateJobDialog } from '@/components/jobs/CreateJobDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function Jobs() {
  const [category, setCategory] = useState('all');
  const { data: listings, isLoading } = useJobListings(category);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Job Board</h1>
            <p className="text-muted-foreground">Find gigs, bounties, and freelance opportunities</p>
          </div>
          <CreateJobDialog />
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            {JOB_CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <JobListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No open listings found. Be the first to post a job!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
