import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useJam,
  useJamSubmissions,
  useMyJamSubmission,
  useMyJamVotes,
  getJamStatus,
} from '@/hooks/useJam';
import { useAuth } from '@/contexts/AuthContext';
import { JamHeader } from '@/components/jam/JamHeader';
import { JamSubmissionCard } from '@/components/jam/JamSubmissionCard';
import { SubmitToJamDialog } from '@/components/jam/SubmitToJamDialog';

export default function JamPage() {
  const { jamId } = useParams<{ jamId: string }>();
  const { user } = useAuth();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { data: jam, isLoading: jamLoading } = useJam(jamId ?? '');
  const { data: submissions, isLoading: subsLoading } = useJamSubmissions(jamId ?? '');
  const { data: mySubmission } = useMyJamSubmission(jamId ?? '');
  const { data: myVotes = {} } = useMyJamVotes(jamId ?? '');

  if (jamLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-16 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!jam) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Jam not found</p>
          <Link to="/forum" className="text-primary text-[13px] hover:underline mt-2 block">
            Back to forum
          </Link>
        </div>
      </MainLayout>
    );
  }

  const status = getJamStatus(jam);
  const canSubmit = status === 'active' && !!user && !mySubmission;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          to={jam.thread_id ? `/forum/${jam.thread_id}` : '/forum'}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#111] transition-colors mb-6"
        >
          ← Forum thread
        </Link>

        <JamHeader jam={jam} />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-bold text-[#111]">
            Submissions{' '}
            {submissions && (
              <span className="text-[#aaa] font-normal text-[14px]">
                ({submissions.length})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {mySubmission && (
              <span className="text-[12px] text-green-600 font-medium">
                Your entry is submitted
              </span>
            )}
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                Submit your entry
              </Button>
            )}
            {!user && status === 'active' && (
              <Link to="/login">
                <Button variant="outline">Sign in to submit</Button>
              </Link>
            )}
          </div>
        </div>

        {subsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-12 text-center">
            <p className="text-[15px] font-semibold text-[#111] mb-1">No submissions yet</p>
            <p className="text-[13px] text-[#999]">
              Be the first to upload a Godot asset and enter the jam.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((s, i) => (
              <JamSubmissionCard
                key={s.id}
                submission={s}
                jamId={jamId!}
                jamStatus={status}
                mySubmissionId={mySubmission?.id ?? null}
                myVote={myVotes[s.id] ?? null}
                currentUserId={user?.id ?? null}
                rank={i + 1}
              />
            ))}
          </div>
        )}

        <SubmitToJamDialog
          jamId={jamId!}
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
        />
      </div>
    </MainLayout>
  );
}
