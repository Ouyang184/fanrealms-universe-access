import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApplyToJob } from '@/hooks/useJobs';

interface JobApplicationDialogProps {
  listingId: string;
  jobTitle: string;
}

export function JobApplicationDialog({ listingId, jobTitle }: JobApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const apply = useApplyToJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apply.mutate(
      {
        listing_id: listingId,
        cover_letter: coverLetter,
        portfolio_url: portfolioUrl || undefined,
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Apply Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply to: {jobTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter</Label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell them why you're a great fit..."
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={apply.isPending}>
            {apply.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
