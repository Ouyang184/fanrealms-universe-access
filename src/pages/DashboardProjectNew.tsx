import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatorCheck } from '@/components/creator-studio/CreatorCheck';
import { useCreatorProjects, useCreateProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function DashboardProjectNewPage() {
  return (
    <DashboardLayout>
      <CreatorCheck>
        <NewProjectForm />
      </CreatorCheck>
    </DashboardLayout>
  );
}

function NewProjectForm() {
  const navigate = useNavigate();
  const { creatorProfile } = useCreatorProjects();
  const create = useCreateProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [website, setWebsite] = useState('');
  const [repository, setRepository] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorProfile?.id || !title.trim()) return;
    const project = await create.mutateAsync({
      creator_id: creatorProfile.id,
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      website_url: website.trim() || undefined,
      repository_url: repository.trim() || undefined,
    });
    navigate('/dashboard/projects');
    void project;
  };

  return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => navigate('/dashboard/projects')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#777] hover:text-[#111]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </button>

      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.5px]">Upload new project</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Create a showcase page for your game or tool.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 bg-white border border-[#eee] rounded-xl p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="My awesome game" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What is this project about?"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="2d, platformer, pixel-art" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo">Repository URL</Label>
            <Input id="repo" type="url" value={repository} onChange={(e) => setRepository(e.target.value)} placeholder="https://github.com/..." />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/projects')}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending || !title.trim()} className="bg-primary hover:bg-[#3a7aab] text-white">
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
}
