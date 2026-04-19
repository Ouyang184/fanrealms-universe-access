import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <MainLayout fullWidth>
      <div className="w-full space-y-4">
        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3 flex items-center justify-between gap-4 flex-wrap">
          <span>
            Indie games made with Godot — discover, play, and share what the community is building.
          </span>
          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Add your game
            </Link>
          )}
        </div>

        {/* Genre chips */}
        <div className="flex gap-1.5 flex-wrap">
          {GAME_GENRES.map((g) => {
            const active = genre === g;
            return (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 text-[12px] font-semibold border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-foreground hover:bg-accent'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Section */}
        <section>
          <div className="flex items-baseline justify-between border-b border-border pb-2 mb-4">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-foreground">
              {genre === 'All' ? 'All games' : genre}
            </h2>
            {!isLoading && games && (
              <span className="text-[11px] text-muted-foreground">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : games && games.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">
                  No games listed yet
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Showcase your Godot game and get it discovered by other devs.
                </p>
              </div>
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Add your game
              </Link>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
