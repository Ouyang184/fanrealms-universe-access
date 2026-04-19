import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThreads, FORUM_CATEGORIES } from '@/hooks/useForum';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 24;
const ALL_CATEGORIES = [...FORUM_CATEGORIES] as const;

export default function Forum() {
  const [category, setCategory] = useState<string>(FORUM_CATEGORIES[0]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: threads, isLoading } = useForumThreads(category) as { data: any[] | undefined; isLoading: boolean };
  const { user } = useAuth();

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category]);

  const visibleThreads = threads?.slice(0, visibleCount) ?? [];
  const remaining = (threads?.length ?? 0) - visibleThreads.length;

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-4">
        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3 flex items-center justify-between gap-4 flex-wrap">
          <span>
            Discuss, share devlogs, ask questions, and connect with other creators.
          </span>
          <CreateThreadDialog />
        </div>

        {/* Segmented category bar */}
        <div className="border border-border bg-card overflow-x-auto">
          <div className="flex divide-x divide-border min-w-max">
            {ALL_CATEGORIES.map((c) => {
              const active = category === c;
              const label = c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex-1 px-4 h-9 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section */}
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              {category}
            </h2>
            {!isLoading && threads && (
              <span className="text-[11px] text-muted-foreground">
                {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] w-full rounded-none" />
              ))}
            </div>
          ) : threads && threads.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>

              {remaining > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="inline-flex items-center px-4 h-9 border border-border bg-card text-foreground text-[12px] font-semibold hover:border-foreground hover:bg-accent transition-colors"
                  >
                    Load more ({remaining} remaining)
                  </button>
                </div>
              )}

              <div className="mt-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Got something to share?
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    Start a thread — devlog, question, showcase, or feedback request.
                  </p>
                </div>
                {user ? (
                  <CreateThreadDialog />
                ) : (
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Sign up to post
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">
                  No threads yet
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Be the first to start a conversation in this category.
                </p>
              </div>
              {user ? (
                <CreateThreadDialog />
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Sign up to post
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
