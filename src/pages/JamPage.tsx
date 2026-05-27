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
  useIsAdmin,
  useAnnounceJamWinners,
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
  const { data: isAdmin = false } = useIsAdmin();
  const announceWinners = useAnnounceJamWinners();

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

  if (!jam || !jamId) {
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

  const handleAnnounceWinners = () => {
    if (!submissions || submissions.length === 0) return;
    const prizes = jam.prize_pool ?? [];
    const top3 = submissions.slice(0, 3).map((s, i) => ({
      rank: i + 1,
      productTitle: s.product?.title ?? 'Untitled',
      creatorName: s.creator?.display_name || s.creator?.username || 'Unknown',
      prize: prizes[i]?.prize ?? '—',
    }));
    if (!confirm('Post winner announcement to the forum thread?')) return;
    announceWinners.mutate({ jam, winners: top3 });
  };

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

        {/* How to enter — shown while jam is upcoming or accepting submissions */}
        {(status === 'upcoming' || status === 'active') && (
          <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-xl p-5 mb-8">
            <h2 className="text-[14px] font-bold text-[#111] mb-3">How to enter</h2>
            {jam.jam_type === 'game' ? (
              <ol className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">1</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Create a free account</strong> on FanRealms if you haven't already.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">2</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Make a Godot game</strong> — any genre, any style, any skill level. You have 2 weeks. Build something playable and publish it on itch.io, GitHub, or anywhere accessible.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">3</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Click "Submit your entry"</strong> and paste a link to your game. The community votes on Fun, Visuals, and Creativity.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">1</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Create a free account</strong> on FanRealms if you haven't already.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">2</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Have an original 2D game asset ready</strong> — sprites, tilesets, UI elements, animations, shaders, fonts, or any 2D art made for games. Any engine. Hosted <strong className="text-[#111]">anywhere</strong>: itch.io, GitHub, Unity Asset Store, FanRealms — wherever it lives.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">3</span>
                  <span className="text-[13px] text-[#444]">
                    <strong className="text-[#111]">Click "Submit your entry"</strong> and paste a link to your asset. That's it.
                  </span>
                </li>
              </ol>
            )}
            <p className="text-[12px] text-[#888] mt-3 pt-3 border-t border-[#eaeff5]">
              {jam.jam_type === 'game'
                ? 'One submission per person · Must be made with Godot · Game must remain playable during voting'
                : 'One submission per person · Must be original work · Asset must remain publicly accessible during the jam'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
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
            {isAdmin && status === 'ended' && submissions && submissions.length > 0 && (
              <Button
                variant="outline"
                onClick={handleAnnounceWinners}
                disabled={announceWinners.isPending}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                🏆 Announce winners
              </Button>
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
              {jam.jam_type === 'game'
                ? 'Be the first to submit a Godot game.'
                : 'Be the first to upload a Godot asset and enter the jam.'}
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
                jamType={jam.jam_type}
                mySubmissionId={mySubmission?.id ?? null}
                myVote={myVotes[s.id] ?? null}
                currentUserId={user?.id ?? null}
                rank={i + 1}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        <SubmitToJamDialog
          jamId={jamId!}
          jamType={jam.jam_type}
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
        />
      </div>
    </MainLayout>
  );
}
