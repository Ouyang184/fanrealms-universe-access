import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useSellerSales } from '@/hooks/useMarketplace';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, Package, TrendingUp, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardProjectDetailPage() {
  return (
    <DashboardLayout>
      <ProjectDetail />
    </DashboardLayout>
  );
}

function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, isLoading: projectLoading } = useProject(projectId);

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['project-assets', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: salesData } = useSellerSales();
  const allSales = salesData?.sales ?? [];

  const projectAssetIds = useMemo(() => new Set(assets.map(a => a.id)), [assets]);
  const projectSales = useMemo(
    () => allSales.filter((s: any) => projectAssetIds.has(s.product_id)),
    [allSales, projectAssetIds]
  );

  const totals = projectSales.reduce(
    (acc, s: any) => ({
      gross: acc.gross + (s.amount ?? 0),
      net: acc.net + (s.net_amount ?? 0),
    }),
    { gross: 0, net: 0 }
  );

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (projectLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }
  if (!project) {
    return <div className="text-[14px] text-[#888]">Project not found.</div>;
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate('/dashboard/projects')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#777] hover:text-[#111]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </button>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] overflow-hidden flex-shrink-0">
          {project.cover_image_url && (
            <img src={project.cover_image_url} className="w-full h-full object-cover" alt="" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold tracking-[-0.5px] truncate">{project.title}</h1>
          <p className="text-[13px] text-[#888] mt-0.5 line-clamp-2">
            {project.description ?? 'No description'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Assets</div>
          <div className="text-[20px] font-bold tracking-[-0.5px]">{assets.length}</div>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Sales</div>
          <div className="text-[20px] font-bold tracking-[-0.5px]">{projectSales.length}</div>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4 border-primary/30">
          <div className="text-[11px] font-bold text-primary uppercase tracking-[0.5px] mb-1">Net earnings</div>
          <div className="text-[20px] font-bold tracking-[-0.5px] text-primary">{fmt(totals.net)}</div>
        </div>
      </div>

      {/* Assets */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold tracking-[-0.3px]">Assets in this project</h2>
          <Button asChild size="sm" className="bg-primary hover:bg-[#3a7aab] text-white text-[12px] font-semibold">
            <Link to={`/dashboard/assets?project=${project.id}`}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New asset
            </Link>
          </Button>
        </div>
        {assetsLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : assets.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {assets.map((a: any, i) => (
              <div
                key={a.id}
                className={`flex items-center gap-4 px-4 py-3.5 ${i < assets.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                  {a.cover_image_url && <img src={a.cover_image_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{a.title}</div>
                  <div className="text-[11px] text-[#aaa]">{a.category ?? 'Uncategorized'}</div>
                </div>
                <div className="text-[13px] font-bold">{a.price === 0 ? 'Free' : fmt(a.price)}</div>
                {a.status === 'published' ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Published</Badge>
                ) : (
                  <Badge variant="outline" className="text-[#aaa] border-[#e5e5e5] text-[10px]">Draft</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-xl p-10 text-center">
            <Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-[#111] mb-1">No assets yet</p>
            <p className="text-[12px] text-[#888] mb-4">Upload an asset and link it to this project.</p>
            <Button asChild size="sm" className="bg-primary hover:bg-[#3a7aab] text-white">
              <Link to={`/dashboard/assets?project=${project.id}`}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Upload asset
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Sales */}
      <section>
        <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Sales for this project</h2>
        {projectSales.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {projectSales.map((s: any, i) => (
              <div
                key={s.id}
                className={`grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3.5 ${i < projectSales.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {(s.digital_products as any)?.title ?? 'Asset'}
                  </div>
                  <div className="text-[11px] text-[#aaa]">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-[13px] text-[#aaa] text-right">{fmt(s.amount)}</div>
                <div className="text-[13px] font-bold text-primary text-right">{fmt(s.net_amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-xl p-10 text-center">
            <TrendingUp className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-[#111] mb-1">No sales yet</p>
            <p className="text-[12px] text-[#888]">Sales of assets linked to this project will show here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
