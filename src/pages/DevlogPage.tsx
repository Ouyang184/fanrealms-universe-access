import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function usePublicDevlog(devlogId: string) {
  return useQuery({
    queryKey: ['public-devlog', devlogId],
    enabled: !!devlogId,
    queryFn: async () => {
      const { data: devlog, error } = await supabase
        .from('devlogs')
        .select('id, title, content, tags, created_at, updated_at, author_id, project_id, projects:project_id(id, title, slug)')
        .eq('id', devlogId)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!devlog) return null;

      // Fetch author profile via creators table
      const { data: creator } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_image_url')
        .eq('user_id', (devlog as any).author_id)
        .maybeSingle();

      return { devlog: devlog as any, creator: creator as any };
    },
  });
}

export default function DevlogPage() {
  const { devlogId } = useParams<{ devlogId: string }>();
  const { data, isLoading } = usePublicDevlog(devlogId ?? '');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!data || !data.devlog) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Post not found</p>
          <Link to="/forum" className="text-primary text-[13px] hover:underline mt-2 block">
            Back to forum →
          </Link>
        </div>
      </MainLayout>
    );
  }

  const { devlog, creator } = data;
  const project = devlog.projects as any;
  const tags: string[] = devlog.tags ?? [];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back link — to project page if available, else to creator profile */}
        {project?.slug ? (
          <Link
            to={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {project.title}
          </Link>
        ) : creator?.username ? (
          <Link
            to={`/${creator.username}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {creator.display_name || creator.username}
          </Link>
        ) : null}

        {/* Header */}
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#111] mb-4">
          {devlog.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#f0f0f0]">
          {creator && (
            <Link
              to={`/${creator.username}`}
              className="inline-flex items-center gap-2 group"
            >
              {creator.profile_image_url ? (
                <img
                  src={creator.profile_image_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#e0e0e0] flex items-center justify-center text-[11px] font-bold text-[#888]">
                  {(creator.display_name || creator.username || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-[13px] font-semibold text-[#444] group-hover:text-primary transition-colors">
                {creator.display_name || creator.username}
              </span>
            </Link>
          )}

          {project && (
            <Link
              to={`/projects/${project.slug}`}
              className="text-[12px] text-[#888] hover:text-primary transition-colors"
            >
              {project.title}
            </Link>
          )}

          <span className="flex items-center gap-1 text-[12px] text-[#aaa] ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(devlog.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#f5f5f5] text-[#555] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="text-[14px] text-[#333] leading-[1.75] whitespace-pre-wrap">
          {devlog.content}
        </div>

      </div>
    </MainLayout>
  );
}
