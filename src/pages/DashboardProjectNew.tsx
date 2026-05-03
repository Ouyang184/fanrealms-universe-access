import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatorCheck } from '@/components/creator-studio/CreatorCheck';
import { useCreatorProjects, useCreateProject } from '@/hooks/useProjects';
import { useCreatorStripeStatus } from '@/hooks/useCreatorStripeStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload, Plus, X, Image as ImageIcon } from 'lucide-react';

export default function DashboardProjectNewPage() {
  return (
    <DashboardLayout>
      <CreatorCheck>
        <NewProjectForm />
      </CreatorCheck>
    </DashboardLayout>
  );
}

const CLASSIFICATIONS = [
  { v: 'game', l: 'Games — A piece of software you can play' },
  { v: 'tool', l: 'Tools — Useful software not for entertainment' },
  { v: 'asset', l: 'Game assets — Sprites, models, sounds, etc.' },
  { v: 'comic', l: 'Comics — Sequential art' },
  { v: 'book', l: 'Books — Written works' },
  { v: 'soundtrack', l: 'Soundtracks — Audio releases' },
  { v: 'physical', l: 'Physical games — Things you can hold' },
  { v: 'other', l: 'Other' },
];

const KINDS = [
  { v: 'downloadable', l: 'Downloadable — You only have files to be downloaded' },
  { v: 'html', l: 'HTML — Playable in the browser' },
  { v: 'physical', l: 'Physical — Shipped to the buyer' },
];

const RELEASE_STATUS = [
  { v: 'released', l: 'Released — Project is complete, but might receive updates' },
  { v: 'in_development', l: 'In development — Project is actively being worked on' },
  { v: 'on_hold', l: 'On hold — Development is paused' },
  { v: 'cancelled', l: 'Cancelled — Project will not be completed' },
  { v: 'prototype', l: 'Prototype — A small test or proof of concept' },
];

const GENRES = ['No genre', 'Action', 'Adventure', 'Card Game', 'Educational', 'Fighting', 'Interactive Fiction', 'Platformer', 'Puzzle', 'Racing', 'Rhythm', 'Role Playing', 'Shooter', 'Simulation', 'Sports', 'Strategy', 'Survival', 'Visual Novel', 'Other'];

const STORE_KEYS: Array<{ key: string; label: string }> = [
  { key: 'steam', label: 'Steam' },
  { key: 'apple', label: 'Apple App Store' },
  { key: 'google', label: 'Google Play' },
  { key: 'amazon', label: 'Amazon App Store' },
  { key: 'windows', label: 'Windows Store' },
];

function NewProjectForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { creatorProfile } = useCreatorProjects();
  const create = useCreateProject();
  const { isCreatorStripeReady } = useCreatorStripeStatus(creatorProfile?.id);
  const hasPayment = !!isCreatorStripeReady;

  // Basics
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState('game');
  const [kind, setKind] = useState('downloadable');
  const [releaseStatus, setReleaseStatus] = useState('released');

  // Cover + media
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>(['']);

  // Pricing
  const [pricingModel, setPricingModel] = useState<'free' | 'paid' | 'no_payments'>('free');
  const [suggestedPrice, setSuggestedPrice] = useState('2.00');

  // Details
  const [genre, setGenre] = useState('No genre');
  const [tagsStr, setTagsStr] = useState('');
  const [aiDisclosure, setAiDisclosure] = useState<'' | 'yes' | 'no'>('');
  const [storeLinks, setStoreLinks] = useState<Record<string, string>>({});
  const [activeStores, setActiveStores] = useState<string[]>([]);

  // Community + visibility
  const [communityMode, setCommunityMode] = useState<'disabled' | 'comments' | 'discussion'>('comments');
  const [visibility, setVisibility] = useState<'draft' | 'restricted' | 'public'>('draft');

  // Links
  const [website, setWebsite] = useState('');
  const [repository, setRepository] = useState('');

  const [busy, setBusy] = useState(false);

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

  const addScreenshot = () => screenshots.length < 5 && setScreenshots(s => [...s, '']);
  const removeScreenshot = (i: number) => setScreenshots(s => s.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, val: string) => setScreenshots(s => s.map((v, idx) => idx === i ? val : v));

  const toggleStore = (key: string) => {
    if (activeStores.includes(key)) {
      setActiveStores(s => s.filter(k => k !== key));
      setStoreLinks(({ [key]: _omit, ...rest }) => rest);
    } else {
      setActiveStores(s => [...s, key]);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorProfile?.id) { toast.error('Creator profile required'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }

    setBusy(true);
    try {
      let cover_image_url: string | undefined;
      if (coverFile) {
        const uploaded = await uploadCover();
        if (uploaded) cover_image_url = uploaded;
      }

      const cleanScreens = screenshots.map(s => s.trim()).filter(Boolean);
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
      const cleanLinks: Record<string, string> = {};
      activeStores.forEach(k => { if (storeLinks[k]?.trim()) cleanLinks[k] = storeLinks[k].trim(); });

      await create.mutateAsync({
        creator_id: creatorProfile.id,
        title: title.trim(),
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        tags,
        cover_image_url,
        classification,
        kind,
        release_status: releaseStatus,
        pricing_model: pricingModel,
        suggested_price_cents: pricingModel === 'paid' ? Math.round(parseFloat(suggestedPrice || '0') * 100) : 0,
        video_url: videoUrl.trim() || undefined,
        screenshots: cleanScreens,
        genre: genre === 'No genre' ? undefined : genre,
        ai_disclosure: aiDisclosure || undefined,
        app_store_links: cleanLinks,
        community_mode: communityMode,
        visibility,
        website_url: website.trim() || undefined,
        repository_url: repository.trim() || undefined,
      });
      navigate('/dashboard/projects');
    } finally {
      setBusy(false);
    }
  };

  const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-1.5">{children}</div>
  );
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[13px] font-semibold text-[#333] block">{children}</label>
  );
  const Help = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[12px] text-[#888] leading-snug">{children}</p>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <button
        onClick={() => navigate('/dashboard/projects')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#777] hover:text-[#111]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </button>

      <div className="bg-white border border-[#eee] rounded-xl">
        <div className="px-6 py-5 border-b border-[#eee]">
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Create a new project</h1>
        </div>

        {!hasPayment && (
          <div className="mx-6 mt-5 p-3 bg-[#fff8dc] border border-[#f0e3a8] rounded-md text-[13px] flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">You don't have payment configured.</span>
            <span className="text-[#666]">If you set a minimum price above 0 no one will be able to download your project.</span>
            <button type="button" onClick={() => navigate('/dashboard/payments')} className="text-primary underline ml-auto">Edit account</button>
          </div>
        )}

        <form onSubmit={onSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-x-8 gap-y-6">
          {/* LEFT column */}
          <div className="space-y-6 min-w-0">
            <div className="border-l-2 border-primary pl-3">
              <p className="text-[13px] font-semibold">Make sure everyone can find your page</p>
              <p className="text-[12px] text-[#777]">Pick a clear title and tagline before publishing.</p>
            </div>

            <Section>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </Section>

            <Section>
              <Label>Short description or tagline</Label>
              <Help>Shown when we link to your project. Avoid duplicating your project's title.</Help>
              <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Optional" maxLength={140} />
            </Section>

            <Section>
              <Label>Classification — What are you uploading?</Label>
              <select value={classification} onChange={e => setClassification(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {CLASSIFICATIONS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </Section>

            <Section>
              <Label>Kind of project</Label>
              <select value={kind} onChange={e => setKind(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {KINDS.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
              </select>
              <p className="text-[11px] text-[#888] mt-0.5"><span className="bg-[#eee] text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1">TIP</span>You can add additional downloadable files for any of the types above.</p>
            </Section>

            <Section>
              <Label>Release status</Label>
              <select value={releaseStatus} onChange={e => setReleaseStatus(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                {RELEASE_STATUS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </Section>

            {/* Pricing */}
            <div>
              <h3 className="text-[16px] font-bold mb-3">Pricing</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'paid', 'no_payments'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setPricingModel(p)}
                    className={`px-3 py-2.5 text-[13px] font-semibold border rounded-md flex items-center justify-center gap-2 transition-colors ${pricingModel === p ? 'border-primary bg-primary/5 text-primary' : 'border-[#e5e5e5] text-[#555] hover:border-[#ccc]'}`}>
                    <span className={`w-3.5 h-3.5 rounded-sm border ${pricingModel === p ? 'bg-primary border-primary' : 'border-[#bbb]'}`} />
                    {p === 'free' ? '$0 or donate' : p === 'paid' ? 'Paid' : 'No payments'}
                  </button>
                ))}
              </div>
              {pricingModel === 'free' && (
                <div className="mt-3">
                  <Help>Someone downloading your project will be asked for a donation before getting access. They can skip to download for free.</Help>
                  <div className="mt-2">
                    <Label>Suggested donation — Default donation amount</Label>
                    <Input type="number" min="0" step="0.01" value={suggestedPrice} onChange={e => setSuggestedPrice(e.target.value)} className="max-w-[160px]" />
                  </div>
                </div>
              )}
              {pricingModel === 'paid' && (
                <div className="mt-3">
                  <Label>Price (USD)</Label>
                  <Input type="number" min="0" step="0.01" value={suggestedPrice} onChange={e => setSuggestedPrice(e.target.value)} className="max-w-[160px]" />
                </div>
              )}
              {pricingModel === 'no_payments' && (
                <Help>No payments will be collected for this project.</Help>
              )}
            </div>

            {/* Details */}
            <div>
              <h3 className="text-[16px] font-bold mb-3">Details</h3>
              <Section>
                <Label>Description</Label>
                <Help>This will make up the content of your project page.</Help>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} />
              </Section>

              <div className="mt-5">
                <Label>Genre</Label>
                <Help>Select the category that best describes your project. You can pick additional genres with tags below.</Help>
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-[13px] border border-[#e5e5e5] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="mt-5">
                <Label>Tags</Label>
                <Help>Any other keywords someone might search for. Max of 10. Comma-separated.</Help>
                <Input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="2d, platformer, pixel-art" className="mt-1.5" />
              </div>

              <div className="mt-5">
                <Label>AI generation disclosure</Label>
                <Help>Please disclose if this project contains content produced by generative AI tools (LLMs, image models, etc.), even if you hand-edited it.</Help>
                <div className="mt-2 space-y-1.5">
                  {[
                    { v: 'yes', l: 'Yes — This project contains the output of Generative AI' },
                    { v: 'no', l: 'No — This project does not contain the output of Generative AI' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-start gap-2 text-[13px] cursor-pointer">
                      <input type="radio" name="ai" checked={aiDisclosure === opt.v} onChange={() => setAiDisclosure(opt.v as 'yes' | 'no')} className="mt-1" />
                      <span>{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <Label>App store links</Label>
                <Help>If your project is available on any other stores we'll link to it.</Help>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STORE_KEYS.map(s => (
                    <button key={s.key} type="button" onClick={() => toggleStore(s.key)}
                      className={`px-2.5 py-1.5 text-[12px] border rounded-md flex items-center gap-1.5 ${activeStores.includes(s.key) ? 'border-primary bg-primary/5 text-primary' : 'border-[#e5e5e5] text-[#555] hover:border-[#ccc]'}`}>
                      <Plus className="w-3 h-3" /> {s.label}
                    </button>
                  ))}
                </div>
                {activeStores.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {activeStores.map(k => (
                      <div key={k} className="flex gap-2 items-center">
                        <span className="text-[12px] w-32 text-[#666]">{STORE_KEYS.find(s => s.key === k)?.label}</span>
                        <Input value={storeLinks[k] || ''} onChange={e => setStoreLinks(s => ({ ...s, [k]: e.target.value }))} placeholder="https://..." />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <Section>
                  <Label>Website URL</Label>
                  <Input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                </Section>
                <Section>
                  <Label>Repository URL</Label>
                  <Input type="url" value={repository} onChange={e => setRepository(e.target.value)} placeholder="https://github.com/..." />
                </Section>
              </div>

              <div className="mt-5">
                <Label>Community</Label>
                <Help>Build a community for your project by letting people post to your page.</Help>
                <div className="mt-2 space-y-1.5">
                  {[
                    { v: 'disabled', l: 'Disabled' },
                    { v: 'comments', l: 'Comments — Add a nested comment thread to the bottom of the project page' },
                    { v: 'discussion', l: 'Discussion board — Dedicated community page with categories, threads, replies & more' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-start gap-2 text-[13px] cursor-pointer">
                      <input type="radio" name="community" checked={communityMode === opt.v} onChange={() => setCommunityMode(opt.v as typeof communityMode)} className="mt-1" />
                      <span>{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <Label>Visibility &amp; access</Label>
                <Help>Use Draft to review your page before making it public.</Help>
                <div className="mt-2 space-y-1.5">
                  {[
                    { v: 'draft', l: 'Draft — Only those who can edit the project can view the page' },
                    { v: 'restricted', l: 'Restricted — Only owners & authorized people can view the page' },
                    { v: 'public', l: 'Public — Anyone can view the page' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-start gap-2 text-[13px] cursor-pointer">
                      <input type="radio" name="visibility" checked={visibility === opt.v} onChange={() => setVisibility(opt.v as typeof visibility)} className="mt-1" />
                      <span>{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT column - sidebar */}
          <aside className="space-y-5">
            <div>
              <Label>Cover image</Label>
              <div
                onClick={() => document.getElementById('cover-input')?.click()}
                className="mt-1.5 w-full aspect-[4/3] border-2 border-dashed border-[#ddd] rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-[#fafafa] transition-colors overflow-hidden"
              >
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-center px-3">
                    <Button type="button" size="sm" className="bg-primary hover:bg-primary/90 pointer-events-none">
                      <Upload className="w-4 h-4 mr-1.5" /> Upload Cover Image
                    </Button>
                  </div>
                )}
                <input id="cover-input" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
              <Help>The cover image is used whenever we link to your project. Required (Minimum: 315×250, Recommended: 630×500).</Help>
            </div>

            <Section>
              <Label>Gameplay video or trailer</Label>
              <Help>Provide a link to YouTube or Vimeo.</Help>
              <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </Section>

            <div>
              <Label>Screenshots</Label>
              <Help>Screenshots will appear on your project's page. Optional but highly recommended. Add 3 to 5 for best results.</Help>
              <div className="mt-2 space-y-2">
                {screenshots.map((url, i) => (
                  <div key={i} className="flex gap-1.5">
                    <Input value={url} onChange={e => updateScreenshot(i, e.target.value)} placeholder="Image URL" type="url" />
                    {screenshots.length > 1 && (
                      <button type="button" onClick={() => removeScreenshot(i)} className="p-2 text-[#aaa] hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {screenshots.length < 5 && (
                  <button type="button" onClick={addScreenshot} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-primary border border-dashed border-[#ddd] rounded-md hover:bg-primary/5">
                    <ImageIcon className="w-3.5 h-3.5" /> Add screenshot
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Footer actions full-width */}
          <div className="lg:col-span-2 flex items-center gap-2 pt-4 border-t border-[#eee]">
            <Button type="submit" disabled={busy || create.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {(busy || create.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save &amp; view page
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/projects')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
