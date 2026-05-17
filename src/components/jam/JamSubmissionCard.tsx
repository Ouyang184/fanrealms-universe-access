// src/components/jam/JamSubmissionCard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVoteOnSubmission, type JamVote, type JamStatus } from '@/hooks/useJam';

interface Submission {
  id: string;
  product_id: string;
  user_id: string;
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
  mySubmissionId: string | null;
  myVote: JamVote | null;
  currentUserId: string | null;
  rank: number;
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
            className={`text-[20px] leading-none transition-colors ${
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
  mySubmissionId,
  myVote,
  currentUserId,
  rank,
}: Props) {
  const voteOnSubmission = useVoteOnSubmission();
  const isOwnEntry = submission.user_id === currentUserId;
  const canVote =
    jamStatus === 'voting' &&
    !!mySubmissionId &&
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

  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:border-[#ddd] transition-colors">
      <div className="relative aspect-video bg-[#f5f5f5] flex items-center justify-center">
        {product?.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[12px] text-[#bbb]">No preview</span>
        )}
        <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-[12px] font-bold text-[#555] shadow-sm border border-[#eee]">
          {rank}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <Link
            to={`/marketplace/${submission.product_id}`}
            className="text-[14px] font-bold text-[#111] hover:text-primary transition-colors line-clamp-1"
          >
            {product?.title ?? 'Untitled'}
          </Link>
          <div className="text-[12px] text-[#888]">
            by {creator?.display_name || creator?.username || 'Unknown'}
            {product?.category && (
              <span className="ml-2 text-[#bbb]">· {product.category}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <ScoreBar label="Usefulness" value={submission.avg_usefulness} />
          <ScoreBar label="Quality"    value={submission.avg_quality} />
          <ScoreBar label="Creativity" value={submission.avg_creativity} />
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
            <StarPicker label="Usefulness" value={usefulness} onChange={v => handleVoteChange('usefulness', v)} />
            <StarPicker label="Quality"    value={quality}    onChange={v => handleVoteChange('quality', v)} />
            <StarPicker label="Creativity" value={creativity} onChange={v => handleVoteChange('creativity', v)} />
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

        {jamStatus === 'voting' && !mySubmissionId && currentUserId && (
          <p className="text-[11px] text-[#aaa] pt-1 border-t border-[#f0f0f0]">
            Submit an entry to unlock voting
          </p>
        )}
      </div>
    </div>
  );
}
