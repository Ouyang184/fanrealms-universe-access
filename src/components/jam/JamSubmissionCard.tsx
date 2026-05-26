// src/components/jam/JamSubmissionCard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useVoteOnSubmission, useRemoveJamSubmission, type JamVote, type JamStatus } from '@/hooks/useJam';

interface Submission {
  id: string;
  product_id: string | null;
  user_id: string;
  external_title: string | null;
  external_url: string | null;
  external_cover_url: string | null;
  external_description: string | null;
  avg_usefulness: number;
  avg_quality: number;
  avg_creativity: number;
  avg_overall: number;
  vote_count: number;
  product: {
    id: string;
    title: string;
    short_description: string | null;
    cover_image_url: string | null;
    category: string | null;
  } | null;
  creator: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
  } | null;
}

interface Props {
  submission: Submission;
  jamId: string;
  jamStatus: JamStatus;
  jamType?: 'asset' | 'game';
  mySubmissionId: string | null;
  myVote: JamVote | null;
  currentUserId: string | null;
  rank: number;
  isAdmin?: boolean;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px] text-[#888]">
        <span>{label}</span>
        <span className="font-semibold text-[#555]">{value > 0 ? value.toFixed(1) : '—'}</span>
      </div>
      <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: value > 0 ? `${(value / 5) * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium text-[#555]">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className={`w-9 h-9 flex items-center justify-center text-[20px] leading-none transition-colors ${
              n <= (hovered || value) ? 'text-yellow-400' : 'text-[#ddd]'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function JamSubmissionCard({
  submission,
  jamId,
  jamStatus,
  jamType = 'asset',
  mySubmissionId,
  myVote,
  currentUserId,
  rank,
  isAdmin = false,
}: Props) {
  const isGame = jamType === 'game';
  // Vote category labels differ between asset jams and game jams
  const voteLabels = isGame
    ? { usefulness: 'Fun', quality: 'Visuals', creativity: 'Creativity' }
    : { usefulness: 'Usefulness', quality: 'Quality', creativity: 'Creativity' };
  const voteOnSubmission = useVoteOnSubmission();
  const removeSubmission = useRemoveJamSubmission();
  const isOwnEntry = submission.user_id === currentUserId;
  const canVote =
    jamStatus === 'voting' &&
    !!currentUserId &&
    !isOwnEntry;

  const [usefulness, setUsefulness] = useState(myVote?.usefulness ?? 0);
  const [quality, setQuality] = useState(myVote?.quality ?? 0);
  const [creativity, setCreativity] = useState(myVote?.creativity ?? 0);
  const [voteSaved, setVoteSaved] = useState(
    (myVote?.usefulness ?? 0) > 0 && (myVote?.quality ?? 0) > 0 && (myVote?.creativity ?? 0) > 0
  );

  useEffect(() => {
    setUsefulness(myVote?.usefulness ?? 0);
    setQuality(myVote?.quality ?? 0);
    setCreativity(myVote?.creativity ?? 0);
  }, [myVote?.usefulness, myVote?.quality, myVote?.creativity]);

  const handleVoteChange = async (
    category: 'usefulness' | 'quality' | 'creativity',
    value: number
  ) => {
    const next = {
      usefulness: category === 'usefulness' ? value : usefulness,
      quality:    category === 'quality'    ? value : quality,
      creativity: category === 'creativity' ? value : creativity,
    };
    if (category === 'usefulness') setUsefulness(value);
    if (category === 'quality')    setQuality(value);
    if (category === 'creativity') setCreativity(value);

    if (next.usefulness > 0 && next.quality > 0 && next.creativity > 0) {
      try {
        await voteOnSubmission.mutateAsync({
          submissionId: submission.id,
          jamId,
          ...next,
        });
        setVoteSaved(true);
      } catch {
        // Roll back to last confirmed vote
        setUsefulness(myVote?.usefulness ?? 0);
        setQuality(myVote?.quality ?? 0);
        setCreativity(myVote?.creativity ?? 0);
        setVoteSaved(false);
      }
    }
  };

  const product = submission.product;
  const creator = submission.creator;
  const isExternal = !submission.product_id;

  // Resolve display fields: prefer FanRealms product data, fall back to external fields
  const title      = product?.title      ?? submission.external_title      ?? 'Untitled';
  const coverUrl   = product?.cover_image_url ?? submission.external_cover_url ?? null;
  const category   = product?.category   ?? null;
  const assetHref  = isExternal
    ? (submission.external_url ?? '#')
    : `/marketplace/${submission.product_id}`;

  const CoverWrapper = ({ children }: { children: React.ReactNode }) =>
    isExternal ? (
      <a href={assetHref} target="_blank" rel="noopener noreferrer"
        className="block relative aspect-video bg-[#f5f5f5] flex items-center justify-center group">
        {children}
      </a>
    ) : (
      <Link to={assetHref} className="block relative aspect-video bg-[#f5f5f5] flex items-center justify-center group">
        {children}
      </Link>
    );

  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:border-[#ddd] transition-colors">
      <CoverWrapper>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <span className="text-[12px] text-[#bbb]">No preview</span>
        )}
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-[12px] font-bold text-[#555] shadow-sm border border-[#eee]">
          {rank}
        </div>
        {isExternal && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-semibold text-white">
            External
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <span className="bg-white text-[12px] font-semibold text-[#111] px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3" /> {isGame ? 'Play game' : 'View asset'}
          </span>
        </div>
      </CoverWrapper>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            {isExternal ? (
              <a
                href={assetHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-bold text-[#111] hover:text-primary transition-colors line-clamp-1 flex-1"
              >
                {title}
              </a>
            ) : (
              <Link
                to={assetHref}
                className="text-[14px] font-bold text-[#111] hover:text-primary transition-colors line-clamp-1 flex-1"
              >
                {title}
              </Link>
            )}
            {isExternal ? (
              <a
                href={assetHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </a>
            ) : (
              <Link
                to={assetHref}
                className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </Link>
            )}
          </div>
          <div className="text-[12px] text-[#888]">
            by {creator?.display_name || creator?.username || 'Unknown'}
            {category && (
              <span className="ml-2 text-[#bbb]">· {category}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <ScoreBar label={voteLabels.usefulness} value={submission.avg_usefulness} />
          <ScoreBar label={voteLabels.quality}    value={submission.avg_quality} />
          <ScoreBar label={voteLabels.creativity} value={submission.avg_creativity} />
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="font-bold text-primary text-[15px]">
            {submission.avg_overall > 0 ? submission.avg_overall.toFixed(1) : '—'}
            <span className="text-[11px] text-[#aaa] font-normal"> / 5</span>
          </span>
          <span className="text-[#aaa]">
            {submission.vote_count} {submission.vote_count === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        {canVote && (
          <div className="pt-2 border-t border-[#f0f0f0] space-y-3">
            <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">
              Your rating
            </p>
            <StarPicker label={voteLabels.usefulness} value={usefulness} onChange={v => handleVoteChange('usefulness', v)} />
            <StarPicker label={voteLabels.quality}    value={quality}    onChange={v => handleVoteChange('quality', v)} />
            <StarPicker label={voteLabels.creativity} value={creativity} onChange={v => handleVoteChange('creativity', v)} />
            {voteSaved && (
              <p className="text-[11px] text-green-600 font-medium">Vote saved</p>
            )}
            {(usefulness === 0 || quality === 0 || creativity === 0) && (
              <p className="text-[11px] text-[#aaa]">Rate all 3 categories to submit your vote</p>
            )}
          </div>
        )}

        {isOwnEntry && (
          <p className="text-[11px] text-[#aaa] pt-1 border-t border-[#f0f0f0]">This is your entry</p>
        )}

        {jamStatus === 'voting' && !currentUserId && (
          <p className="text-[11px] text-[#aaa] pt-1 border-t border-[#f0f0f0]">
            Sign in to vote
          </p>
        )}

        {isAdmin && (
          <div className="pt-2 border-t border-red-100">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove "${title}" from the jam?`)) {
                  removeSubmission.mutate({ submissionId: submission.id, jamId });
                }
              }}
              disabled={removeSubmission.isPending}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Remove submission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
