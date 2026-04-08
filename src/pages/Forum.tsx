import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThreads, FORUM_CATEGORIES } from '@/hooks/useForum';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function Forum() {
  const [category, setCategory] = useState('all');
  const { data: threads, isLoading } = useForumThreads(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Forum</h1>
            <p className="text-muted-foreground">Discuss, share devlogs, and connect with the community</p>
          </div>
          <CreateThreadDialog />
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            {FORUM_CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No threads yet. Start the conversation!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
