import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useSellerSales } from '@/hooks/useMarketplace';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Package, TrendingUp, Save, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CLASSIFICATIONS = [
  { v: 'game',       l: 'Games' },
  { v: 'tool',       l: 'Tools' },
  { v: 'asset',      l: 'Game assets' },
  { v: 'comic',      l: 'Comics' },
  { v: 'book',       l: 'Books' },
  { v: 'soundtrack', l: 'Soundtracks' },
  { v: 'other',      l: 'Other' },
];

const GENRES = ['No genre','Action','Adventure','Card Game','Educational','Fighting','Interactive Fiction','Platformer','Puzzle','Racing','Rhythm','Role Playing','Shooter','Simulation','Sports','Strategy','Survival','Visual Novel','Other'];

const RELEASE_STATUSES = [
  { v: 'released',       l: 'Released' },
  { v: 'in_development', l: 'In development' },
  { v: 'on_hold',        l: 'On hold' },
  { v: 'cancelled',      l: 'Cancelled' },
  { v: 'prototype',      l: 'Prototype' },
];

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
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [tab, setTab] = useState<'stats' | 'edit'>('stats');

  // ── Edit form state ──────────────────────────────────────────────────────
  const [title, setTitle]                     = useState('');
  const [shortDesc, setShortDesc]             = useState('');
  const [description, setDescription]         = useState('');
  const [classification, setClassification]   = useState('game');
  const [releaseStatus, setReleaseStatus]     = useState('released');
  const [genre, setGenre]                     = useState('No genre');
  const [tagsStr, setTagsStr]                 = useState('');
  const [videoUrl, setVideoUrl]               = useState('');
  const [screenshots, setScreenshots]         = useState<string[]>(['']);
  const [website, setWebsite]                 = useState('');
  const [repository, setRepository]           = useState('');
  const [visibility, setVisibility]           = useState<'draft' | 'restricted' | 'public'>('draft');
  const [coverFile, setCoverFile]             = useState<File | null>(null);
  const [coverPreview, setCoverPreview]       = useState<string | null>(null);
  const [saving, setSaving]                   = useState(false);

  // Populate form when project loads
  useEffect(() => {
    if (!project) return;
    const p = project as any;
    setTitle(p.title ?? '');
    setShortDesc(p.short_description ?? '');
    setDescription(p.description ?? '');
    setClassification(p.classification ?? 'game');
    setReleaseStatus(p.release_status ?? 'released');
    setGenre(p.genre ?? 'No genre');
    setTagsStr((p.tags ?? []).join(', '));
    setVideoUrl(p.video_url ?? '');
    setScreenshots((p.screenshots ?? []).length > 0 ? p.screenshots : ['']);
    setWebsite(p.website_url ?? '');
    setRepository(p.repository_url ?? '');
    setVisibility(p.visibility ?? 'draft');
    setCoverPreview(p.cover_image_url ?? null);
  }, [project]);

  // ── Stats data ────────────────────────────────────────────────────────────
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['project-assets', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('id, title, cover_image_url, category, price, status')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: salesData } = useSellerSales();
  const allSales = salesData?.sales ?? [];
  const projectAssetIds = useMemo(() => new Set(assets.map((a: any) => a.id)), [assets]);
  const projectSales = useMemo(
    () => allSales.filter((s: any) => projectAssetIds.has(s.product_id)),
    [allSales, projectAssetIds]
  );
  const totals = projectSales.reduce(
    (acc, s: any) => ({ gross: acc.gross + (s.amount ?? 0), net: acc.net + (s.net_amount ?? 0) }),
    { gross: 0, net: 0 }
  );
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please pick an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Cover must be under 5MB'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile || !user) return null;
    const ext = coverFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, coverFile, { upsert: true });
    if (error) { toast.error('Cover upload failed: ' + error.message); return null; }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let cover_image_url = (project as any)?.cover_image_url ?? null;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) cover_image_url = uploaded;
      }
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
      const cleanScreens = screenshots.map(s => s.trim()).filter(Boolean);
      await updateProject.mutateAsync({
        id: projectId!,
        title: title.trim(),
        short_description: shortDesc.trim() || null,
        description: description.trim() || null,
        classification,
        release_status: releaseStatus,
        genre: genre === 'No genre' ? null : genre,
        tags,
        video_url: videoUrl.trim() || null,
        screenshots: cleanScreens,
        website_url: website.trim() || null,
        repository_url: repository.trim() || null,
        visibility,
        cover_image_url,
        status: visibility === 'public' ? 'published' : 'draft',
      });
      setCoverFile(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${project?.title}"? This cannot be undone.`)) return;
    deleteProject.mutate(projectId!, { onSuccess: () => navigate('/dashboard/projects') });
  };

  if (projectLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!project) return <div className="text-[14px] text-[#888]">Project not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/dashboard/projects')}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#777] hover:text-[#111]">
          <ArrowLeft className="w-4 h-4" />Back to projects
        </button>
        {(project as any).slug && (
          <a href={`/projects/${(project as any).slug}`} target="_blank" rel="noopener noreferrer"
            className="text-[12px] text-primary hover:underline">
            View public page →
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#eee]">
        {(['stats', 'edit'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn('px-5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px capitalize transition-colors',
              tab === t ? 'border-primary text-[#111]' : 'border-transparent text-[#888] hover:text-[#111]')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] overflow-hidden flex-shrink-0">
              {(project as any).cover_image_url && (
                <img src={(project as any).cover_image_url} className="w-full h-full object-cover" alt="" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-bold tracking-[-0.5px] truncate">{project.title}</h1>
              <p className="text-[13px] text-[#888] mt-0.5 line-clamp-2">{(project as any).description ?? 'No description'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold tracking-[-0.3px]">Assets in this project</h2>
              <Button asChild size="sm" className="bg-primary hover:bg-[#3a7aab] text-white text-[12px] font-semibold">
                <Link to={`/dashboard/assets?project=${project.id}`}><Plus className="w-3.5 h-3.5 mr-1.5" />New asset</Link>
              </Button>
            </div>
            {assetsLoading ? <Skeleton className="h-20 w-full rounded-xl" /> :
              assets.length > 0 ? (
                <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
                  {(assets as any[]).map((a: any, i: number) => (
                    <div key={a.id} className={`flex items-center gap-4 px-4 py-3.5 ${i < assets.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                      <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                        {a.cover_image_url && <img src={a.cover_image_url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{a.title}</div>
                        <div className="text-[11px] text-[#aaa]">{a.category ?? 'Uncategorized'}</div>
                      </div>
                      <div className="text-[13px] font-bold">{a.price === 0 ? 'Free' : fmt(a.price)}</div>
                      {a.status === 'published'
                        ? <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Published</Badge>
                        : <Badge variant="outline" className="text-[#aaa] border-[#e5e5e5] text-[10px]">Draft</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-[#e5e5e5] rounded-xl p-10 text-center">
                  <Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-[#111] mb-1">No assets yet</p>
                  <Button asChild size="sm" className="bg-primary hover:bg-[#3a7aab] text-white mt-2">
                    <Link to={`/dashboard/assets?project=${project.id}`}><Plus className="w-3.5 h-3.5 mr-1.5" />Upload asset</Link>
                  </Button>
                </div>
              )}
          </section>
        </div>
      )}

      {tab === 'edit' && (
        <div className="space-y-6 max-w-2xl">

          {/* Cover image */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#333]">Cover image</label>
            <div
              onClick={() => document.getElementById('proj-cover-input')?.click()}
              className="relative w-full aspect-video rounded-xl border-2 border-dashed border-[#ddd] overflow-hidden cursor-pointer hover:border-primary transition-colors bg-[#fafafa] flex items-center justify-center"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[13px] text-[#aaa]">Click to upload cover image</span>
              )}
            </div>
            <input id="proj-cover-input" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#333]">Title <span className="text-red-400">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          </div>

          {/* Short description */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#333]">Short description</label>
            <Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} maxLength={140} placeholder="Shown in search results and cards" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#333]">Full description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} placeholder="Describe your project…" />
          </div>

          {/* Classification + Release status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Classification</label>
              <select value={classification} onChange={e => setClassification(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {CLASSIFICATIONS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Release status</label>
              <select value={releaseStatus} onChange={e => setReleaseStatus(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {RELEASE_STATUSES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
          </div>

          {/* Genre + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Tags</label>
              <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="action, rpg, pixel-art" />
              <p className="text-[11px] text-[#aaa]">Comma-separated, up to 10</p>
            </div>
          </div>

          {/* Trailer video URL */}
          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-[#333]">Trailer video URL</label>
            <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube or Vimeo URL" />
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#333]">Screenshot URLs</label>
            {screenshots.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input value={s} onChange={e => setScreenshots(sc => sc.map((v, idx) => idx === i ? e.target.value : v))}
                  placeholder="https://…" />
                <button type="button" onClick={() => setScreenshots(sc => sc.filter((_, idx) => idx !== i))}
                  className="p-2 text-[#ccc] hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {screenshots.length < 5 && (
              <button type="button" onClick={() => setScreenshots(s => [...s, ''])}
                className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />Add screenshot
              </button>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Website URL</label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-[#333]">Repository URL</label>
              <Input value={repository} onChange={e => setRepository(e.target.value)} placeholder="https://github.com/…" />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-[#333]">Visibility</label>
            <div className="flex gap-3">
              {(['draft', 'public'] as const).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visibility" value={v} checked={visibility === v}
                    onChange={() => setVisibility(v)} className="accent-primary" />
                  <span className="text-[13px] capitalize">{v}</span>
                </label>
              ))}
            </div>
            {classification === 'game' && visibility === 'public' && (
              <p className="text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded">
                This project will appear on the Games showcase when saved.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#f0f0f0]">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <button type="button" onClick={handleDelete} disabled={deleteProject.isPending}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" />Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
