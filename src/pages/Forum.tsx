import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThreads, FORUM_CATEGORIES } from '@/hooks/useForum';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';

export default function Forum() {
  const [category, setCategory] = useState('all');
  const { data: threads, isLoading } = useForumThreads(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Forum</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Discuss, share devlogs, and connect with the community</p>
          </div>
          <CreateThreadDialog />
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
          {FORUM_CATEGORIES.map((c) => (
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
              <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
            {threads.map((thread, i) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isLast={i === threads.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No threads yet. Start the conversation!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
