import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useSellerSales, useRefundPurchase } from '@/hooks/useMarketplace';
import { useCreatorProjects } from '@/hooks/useProjects';
import { useCreatorSales, useCreateSale, useDeleteSale, useCreatorBundles, useCreateBundle, useUpdateBundleStatus, useDeleteBundle } from '@/hooks/useSalesBundles';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, Plus, Tag, Package, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function DashboardSalesPage() {
  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Sales & Bundles</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Discount campaigns, project bundles, and revenue</p>
        </div>

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-6"><SalesTab /></TabsContent>
          <TabsContent value="bundles" className="mt-6"><BundlesTab /></TabsContent>
          <TabsContent value="history" className="mt-6"><HistoryTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InfoBanner() {
  return (
    <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-xl p-4 text-[13px] text-[#445] leading-relaxed">
      <p className="mb-2"><strong>How sales work:</strong> A sale lets you set a time period where some of your projects are available at a reduced price. You can also create bundles to let someone buy multiple projects at once.</p>
      <p className="text-[12px] text-[#778]">For a project to be eligible for a sale it must be downloadable and have a minimum price greater than zero.</p>
    </div>
  );
}

function SalesTab() {
  const { data: sales, isLoading } = useCreatorSales();
  const del = useDeleteSale();

  return (
    <div className="space-y-6">
      <InfoBanner />
      <div className="flex justify-end">
        <CreateSaleDialog />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (sales ?? []).length > 0 ? (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          {sales!.map((s: any, i: number) => {
            const now = new Date();
            const start = new Date(s.starts_at);
            const end = new Date(s.ends_at);
            const state = now < start ? 'Scheduled' : now > end ? 'Ended' : 'Active';
            const stateColor = state === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : state === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#f5f5f5] text-[#888] border-[#ddd]';
            return (
              <div key={s.id} className={`flex items-center gap-4 px-4 py-3.5 ${i < sales!.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                <Tag className="w-4 h-4 text-[#aaa]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{s.name}</div>
                  <div className="text-[11px] text-[#aaa]">
                    {s.discount_percent}% off · {s.sale_items?.length ?? 0} project(s) · {start.toLocaleDateString()} → {end.toLocaleDateString()}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stateColor}`}>{state.toUpperCase()}</span>
                <button onClick={() => { if (confirm('Delete this sale?')) del.mutate(s.id); }} className="text-[#aaa] hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Tag className="w-8 h-8 text-[#ccc] mx-auto mb-3" />} title="No sales yet" hint="Create a sale to offer time-limited discounts." />
      )}
    </div>
  );
}

function CreateSaleDialog() {
  const [open, setOpen] = useState(false);
  const { projects } = useCreatorProjects();
  const create = useCreateSale();
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState(20);
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reset = () => { setName(''); setDiscount(20); setStarts(''); setEnds(''); setSelected(new Set()); };
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const submit = () => {
    if (!name.trim() || !starts || !ends || selected.size === 0) return;
    create.mutate(
      { name: name.trim(), discount_percent: discount, starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(), project_ids: Array.from(selected) },
      { onSuccess: () => { setOpen(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"><Plus className="w-4 h-4 mr-2" />Create a sale</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create a sale</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring Sale" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Discount %</Label><Input type="number" min={1} max={90} className="mt-1.5" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
            <div><Label>Starts</Label><Input type="datetime-local" className="mt-1.5" value={starts} onChange={(e) => setStarts(e.target.value)} /></div>
            <div><Label>Ends</Label><Input type="datetime-local" className="mt-1.5" value={ends} onChange={(e) => setEnds(e.target.value)} /></div>
          </div>
          <div>
            <Label>Projects</Label>
            <div className="mt-1.5 max-h-48 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f5f5f5]">
              {projects.length === 0 && <div className="px-3 py-4 text-[12px] text-[#aaa]">No projects yet.</div>}
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#fafafa]">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <span className="text-[13px]">{p.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} className="bg-primary hover:bg-[#3a7aab] text-white">{create.isPending ? 'Creating...' : 'Create sale'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BundlesTab() {
  const { data: bundles, isLoading } = useCreatorBundles();
  const updateStatus = useUpdateBundleStatus();
  const del = useDeleteBundle();

  return (
    <div className="space-y-6">
      <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-xl p-4 text-[13px] text-[#445]">
        Bundle multiple projects into one purchase at a single price. Buyers get all included projects.
      </div>
      <div className="flex justify-end"><CreateBundleDialog /></div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (bundles ?? []).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bundles!.map((b: any) => (
            <div key={b.id} className="bg-white border border-[#eee] rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                  {b.cover_image_url && <img src={b.cover_image_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{b.title}</div>
                  <div className="text-[11px] text-[#aaa]">{b.bundle_items?.length ?? 0} project(s) · {fmt(b.bundle_price)}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${b.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#f5f5f5] text-[#888] border-[#ddd]'}`}>
                  {b.status === 'published' ? 'LIVE' : 'DRAFT'}
                </span>
              </div>
              {b.description && <p className="text-[12px] text-[#666] mb-3 line-clamp-2">{b.description}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: b.id, status: b.status === 'published' ? 'draft' : 'published' })}>
                  {b.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <button onClick={() => { if (confirm('Delete bundle?')) del.mutate(b.id); }} className="ml-auto text-[#aaa] hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Package className="w-8 h-8 text-[#ccc] mx-auto mb-3" />} title="No bundles yet" hint="Group projects into a discounted bundle." />
      )}
    </div>
  );
}

function CreateBundleDialog() {
  const [open, setOpen] = useState(false);
  const { projects } = useCreatorProjects();
  const create = useCreateBundle();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [cover, setCover] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reset = () => { setTitle(''); setDescription(''); setPriceDollars(''); setCover(''); setSelected(new Set()); };
  const toggle = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const submit = () => {
    const cents = Math.round(Number(priceDollars) * 100);
    if (!title.trim() || !cents || selected.size < 2) return;
    create.mutate(
      { title: title.trim(), description: description.trim() || undefined, bundle_price: cents, cover_image_url: cover.trim() || undefined, project_ids: Array.from(selected), status: 'draft' },
      { onSuccess: () => { setOpen(false); reset(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"><Plus className="w-4 h-4 mr-2" />Create a bundle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create a bundle</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price ($)</Label><Input type="number" min={0} step="0.01" className="mt-1.5" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} /></div>
            <div><Label>Cover image URL</Label><Input className="mt-1.5" value={cover} onChange={(e) => setCover(e.target.value)} /></div>
          </div>
          <div>
            <Label>Projects (pick at least 2)</Label>
            <div className="mt-1.5 max-h-48 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f5f5f5]">
              {projects.length === 0 && <div className="px-3 py-4 text-[12px] text-[#aaa]">No projects yet.</div>}
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#fafafa]">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <span className="text-[13px]">{p.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} className="bg-primary hover:bg-[#3a7aab] text-white">{create.isPending ? 'Creating...' : 'Create bundle'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryTab() {
  const { data, isLoading } = useSellerSales();
  const { sales, totals } = data ?? { sales: [], totals: { gross: 0, fees: 0, net: 0 } };

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#eee] rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Gross revenue</div>
            <div className="text-[24px] font-bold tracking-[-0.5px]">{fmt(totals.gross)}</div>
            <div className="text-[11px] text-[#aaa] mt-0.5">{sales.length} sale{sales.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="bg-white border border-[#eee] rounded-xl p-5">
            <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px] mb-1">Platform fees (10%)</div>
            <div className="text-[24px] font-bold tracking-[-0.5px] text-[#aaa]">{fmt(totals.fees)}</div>
          </div>
          <div className="bg-white border border-[#eee] rounded-xl p-5 border-primary/30">
            <div className="text-[11px] font-bold text-primary uppercase tracking-[0.5px] mb-1">Your earnings</div>
            <div className="text-[24px] font-bold tracking-[-0.5px] text-primary">{fmt(totals.net)}</div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-4">Transaction history</h2>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : sales.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-x-auto">
            {sales.map((sale: any, i: number) => (
              <div key={sale.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 min-w-[380px] ${i < sales.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{sale.digital_products?.title ?? 'Asset'}</div>
                  <div className="text-[11px] text-[#aaa]">{formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}</div>
                </div>
                <div className="text-[13px] font-semibold text-right">{fmt(sale.amount)}</div>
                <div className="text-[13px] text-[#aaa] text-right">{fmt(sale.platform_fee)}</div>
                <div className="text-[13px] font-bold text-primary text-right">{fmt(sale.net_amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<TrendingUp className="w-8 h-8 text-[#ccc] mx-auto mb-3" />} title="No sales yet" hint="Publish a project to start earning." />
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
      {icon}
      <p className="text-[14px] font-semibold text-[#111] mb-1">{title}</p>
      <p className="text-[12px] text-[#999]">{hint}</p>
    </div>
  );
}
