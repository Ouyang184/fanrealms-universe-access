import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateJobListing, JOB_CATEGORIES } from '@/hooks/useJobs';
import { Plus } from 'lucide-react';

export function CreateJobDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [category, setCategory] = useState('Other');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetType, setBudgetType] = useState('fixed');
  const createJob = useCreateJobListing();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJob.mutate(
      {
        title,
        description,
        requirements,
        category,
        budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
        budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
        budget_type: budgetType,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setDescription('');
          setRequirements('');
          setBudgetMin('');
          setBudgetMax('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Post a Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Post a Job / Bounty</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Title</Label>
            <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-desc">Description</Label>
            <Textarea id="job-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-req">Requirements</Label>
            <Textarea id="job-req" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget Type</Label>
              <Select value={budgetType} onValueChange={setBudgetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="bounty">Bounty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-min">Budget Min ($)</Label>
              <Input id="budget-min" type="number" min="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-max">Budget Max ($)</Label>
              <Input id="budget-max" type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createJob.isPending}>
            {createJob.isPending ? 'Posting...' : 'Post Job'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
