import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useIndieGames, GAME_GENRES } from '@/hooks/useIndieGames';
import { GameCard } from '@/components/games/GameCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function GamesPage() {
  const [genre, setGenre] = useState('All');
  const { data: games, isLoading } = useIndieGames(genre);
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Indie Games</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Discover games made by the FanRealms community</p>
          </div>
          {user && (
            <button className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#be123c] transition-colors">
              Add your game
            </button>
          )}
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 flex-wrap">
          {GAME_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                genre === g
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-[#666] border-[#e5e5e5] hover:border-[#ccc]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#aaa]">
            No games yet. Be the first to add yours!
          </div>
        )}
      </div>
    </MainLayout>
  );
}
