import { IndieGame } from '@/hooks/useIndieGames';
import { ExternalLink } from 'lucide-react';
import { useGameRatingSummary, useSubmitGameRating, useGameRatings } from '@/hooks/useGameRatings';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating, RatingSummary } from '@/components/ratings/StarRating';

interface GameCardProps {
  game: IndieGame;
}

export function GameCard({ game }: GameCardProps) {
  const { user } = useAuth();
  const summary = useGameRatingSummary(game.id);
  const { data: ratings } = useGameRatings(game.id);
  const submitRating = useSubmitGameRating(game.id);

  const myRating = user && ratings
    ? (ratings.find((r: any) => r.user_id === user.id)?.rating ?? 0)
    : 0;

  const handleRate = (rating: number) => {
    if (!user) return;
    submitRating.mutate(rating);
  };

  return (
    <div className="bg-white border border-[#eee] rounded-xl overflow-hidden hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 group">
      {/* 16:9 thumbnail */}
      <div className="aspect-video bg-[#111] overflow-hidden">
        {game.thumbnail_url ? (
          <img
            src={game.thumbnail_url}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#444] font-medium uppercase tracking-wide">
            No cover
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="text-[13px] font-semibold truncate">{game.title}</div>

        {/* Rating row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user ? (
              <StarRating
                rating={myRating}
                onRatingChange={handleRate}
                size="sm"
              />
            ) : (
              <RatingSummary average={summary.average} count={summary.count} />
            )}
            {user && summary.count > 0 && (
              <span className="text-[11px] text-[#aaa]">({summary.count})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {game.genre && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#555]">
                {game.genre}
              </span>
            )}
            <a
              href={game.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              {game.external_platform || 'Play'}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
