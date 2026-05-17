import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useForumThread, useForumReplies } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ReplyEditor } from '@/components/forum/ReplyEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h1:mt-2 prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-table:text-sm prose-hr:my-6 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return !inline ? (
              <SyntaxHighlighter style={oneDark} language={match![1]} PreTag="div">
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>{children}</code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const { data: thread, isLoading: threadLoading } = useForumThread(threadId || '') as { data: any; isLoading: boolean };
  const { data: replies, isLoading: repliesLoading } = useForumReplies(threadId || '') as { data: any[] | undefined; isLoading: boolean };

  // Increment view count once per page load
  useEffect(() => {
    if (!threadId) return;
    supabase.rpc('increment_thread_view_count', { thread_id: threadId });
  }, [threadId]);

  if (threadLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!thread) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Thread not found.</p>
          <Button asChild variant="link"><Link to="/forum">Back to Forum</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidth>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/forum"><ArrowLeft className="h-4 w-4 mr-2" />Back to Forum</Link>
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold">{thread.title}</h1>
              {thread.category && <Badge variant="outline">{thread.category}</Badge>}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              by {thread.users?.username || 'Anonymous'} · {format(new Date(thread.created_at), 'MMM d, yyyy h:mm a')}
            </div>
            <MarkdownContent content={thread.content} />
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {thread.reply_count} {thread.reply_count === 1 ? 'Reply' : 'Replies'}
          </h2>

          {repliesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : replies && replies.length > 0 ? (
            replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    by {reply.users?.username || 'Anonymous'} · {format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                  <MarkdownContent content={reply.content} />
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No replies yet. Be the first!</p>
          )}
        </div>

        {!thread.is_locked && (
          <>
            <Separator />
            {user ? (
              <div>
                <h3 className="font-semibold mb-3">Post a Reply</h3>
                <ReplyEditor threadId={thread.id} />
              </div>
            ) : (
              <div className="border border-border bg-card px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Sign in to join the conversation
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    Create a free account to reply, post threads, and follow creators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}>Log in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={`/signup?returnTo=${encodeURIComponent(location.pathname)}`}>Sign up</Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
