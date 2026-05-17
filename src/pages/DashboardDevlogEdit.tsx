import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useDevlog, useSaveDevlog } from '@/hooks/useDevlogs';
import { useCreatorProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardDevlogEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id;
  const { data: existing } = useDevlog(id);
  const { projects } = useCreatorProjects();
  const save = useSaveDevlog();

  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    if (existing) {
      setProjectId(existing.project_id);
      setTitle(existing.title);
      setContent(existing.content);
      setStatus(existing.status as any);
    }
  }, [existing]);

  const onSave = (overrideStatus?: 'draft' | 'published') => {
    if (!projectId || !title.trim() || !content.trim()) {
      if (!projectId) toast.error('Please select a project');
      else if (!title.trim()) toast.error('Title is required');
      else toast.error('Content is required');
      return;
    }
    const finalStatus = overrideStatus ?? status;
    save.mutate(
      { id, project_id: projectId, title: title.trim(), content, status: finalStatus },
      { onSuccess: () => nav('/dashboard/devlogs') }
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-[20px] font-bold tracking-[-0.5px]">{isNew ? 'New post' : 'Edit post'}</h1>

        <div className="space-y-4 bg-white border border-[#eee] rounded-xl p-6">
          <div>
            <Label className="text-[12px] font-semibold">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[12px] font-semibold">Title</Label>
            <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's new?" />
          </div>
          <div>
            <Label className="text-[12px] font-semibold">Content (Markdown)</Label>
            <Textarea className="mt-1.5 min-h-[300px] font-mono text-[13px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your update..." />
          </div>
          {!isNew && (
            <div>
              <Label className="text-[12px] font-semibold">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="mt-1.5 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => nav('/dashboard/devlogs')}>Cancel</Button>
            {isNew ? (
              <>
                <Button variant="outline" onClick={() => onSave('draft')} disabled={save.isPending}>
                  Save draft
                </Button>
                <Button onClick={() => onSave('published')} disabled={save.isPending} className="bg-primary hover:bg-[#3a7aab] text-white">
                  {save.isPending ? 'Saving...' : 'Publish'}
                </Button>
              </>
            ) : (
              <Button onClick={() => onSave()} disabled={save.isPending} className="bg-primary hover:bg-[#3a7aab] text-white">
                {save.isPending ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
