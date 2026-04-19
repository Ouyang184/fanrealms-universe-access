import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThreads, FORUM_CATEGORIES } from '@/hooks/useForum';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { MessageSquare } from 'lucide-react';

export default function Forum() {
  const [category, setCategory] = useState('all');
  const { data: threads, isLoading } = useForumThreads(category) as { data: any[] | undefined; isLoading: boolean };

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-[#aaa]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#111] mb-2">No threads yet</h3>
            <p className="text-[13px] text-[#888] max-w-xs mb-6 leading-relaxed">
              Be the first to start a conversation — share devlogs, ask questions, or introduce yourself.
            </p>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-primary rounded-[10px] hover:bg-[#3a7aab] transition-colors"
            >
              Start a thread
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
