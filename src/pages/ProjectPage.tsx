import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Github, Globe, FileText, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { safeHref } from '@/lib/safeHref';
import { parseVideoUrl } from '@/utils/videoUtils';

function usePublicProject(slug: string) {
  return useQuery({
    queryKey: ['public-project', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!project) return null;

      // Fetch creator profile
      const { data: creator } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_image_url')
        .eq('id', (project as any).creator_id)
        .maybeSingle();

      // Fetch published assets linked to this project
      const { data: assets } = await supabase
        .from('digital_products')
        .select('id, creator_id, title, short_description, cover_image_url, price, category, status, tags, created_at, updated_at, creators(id, username, display_name, profile_image_url)')
        .eq('project_id', project.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // Fetch published devlogs
      const { data: devlogs } = await supabase
        .from('devlogs')
        .select('id, title, content, created_at')
        .eq('project_id', project.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        project: project as any,
        creator: creator as any,
        assets: (assets ?? []) as any[],
        devlogs: (devlogs ?? []) as any[],
      };
    },
  });
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = usePublicProject(slug ?? '');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </MainLayout>
    );
  }

  if (!data || !data.project) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Project not found</p>
          <Link to="/games" className="text-primary text-[13px] hover:underline mt-2 block">
            Browse games →
          </Link>
        </div>
      </MainLayout>
    );
  }

  const { project, creator, assets, devlogs } = data;
  const screenshots: string[] = project.screenshots ?? [];
  const tags: string[] = project.tags ?? [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Back link */}
        {creator?.username && (
          <Link
            to={`/${creator.username}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {creator.display_name || creator.username}
          </Link>
        )}

        {/* Cover */}
        {project.cover_image_url && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#f5f5f5]">
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#111]">{project.title}</h1>
              {creator && (
                <Link
                  to={`/${creator.username}`}
                  className="inline-flex items-center gap-2 mt-1.5 group"
                >
                  {creator.profile_image_url ? (
                    <img
                      src={creator.profile_image_url}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#e0e0e0]" />
                  )}
                  <span className="text-[13px] text-[#666] group-hover:text-primary transition-colors">
                    {creator.display_name || creator.username}
                  </span>
                </Link>
              )}
            </div>

            {/* External links */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {project.website_url && (
                <a
                  href={safeHref(project.website_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#ddd] rounded-lg text-[#444] hover:border-[#aaa] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
              {project.repository_url && (
                <a
                  href={safeHref(project.repository_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#ddd] rounded-lg text-[#444] hover:border-[#aaa] transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  Source
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.genre && (
                <span className="px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary rounded-full">
                  {project.genre}
                </span>
              )}
              {tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-[#f5f5f5] text-[#555] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Video */}
        {project.video_url && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={project.video_url}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Project video"
            />
          </div>
        )}

        {/* Description */}
        {(project.description || project.short_description) && (
          <section>
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-3">About</h2>
            <p className="text-[14px] text-[#444] leading-relaxed whitespace-pre-wrap">
              {project.description || project.short_description}
            </p>
          </section>
        )}

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-3">Screenshots</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {screenshots.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-video rounded-xl overflow-hidden bg-[#f5f5f5] block hover:opacity-90 transition-opacity"
                >
                  <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Assets */}
        {assets.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-3">
              Assets{' '}
              <span className="text-[#aaa] font-normal text-[14px]">({assets.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset: any) => (
                <ProductCard key={asset.id} product={asset} />
              ))}
            </div>
          </section>
        )}

        {/* Devlogs */}
        {devlogs.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-3">
              Devlogs{' '}
              <span className="text-[#aaa] font-normal text-[14px]">({devlogs.length})</span>
            </h2>
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              {devlogs.map((d: any, i: number) => (
                <div
                  key={d.id}
                  className={`flex items-start gap-3 px-4 py-4 ${i < devlogs.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
                >
                  <FileText className="w-4 h-4 text-[#aaa] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111]">{d.title}</p>
                    {d.content && (
                      <p className="text-[12px] text-[#666] line-clamp-2 mt-0.5">{d.content}</p>
                    )}
                    <p className="text-[11px] text-[#aaa] mt-1">
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </MainLayout>
  );
}
