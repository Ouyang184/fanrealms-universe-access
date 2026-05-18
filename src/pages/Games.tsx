import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useIndieGames, GAME_GENRES } from '@/hooks/useIndieGames';
import { GameCard } from '@/components/games/GameCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 24;

export default function GamesPage() {
  const [genre, setGenre] = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: games, isLoading } = useIndieGames(genre);
  const { user } = useAuth();

  // Reset pagination when genre changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [genre]);

  const visibleGames = games?.slice(0, visibleCount) ?? [];
  const remaining = (games?.length ?? 0) - visibleGames.length;

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-4">
        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div>
              Indie games made with Godot — discover, play, and share what the community is building.
            </div>
            <div className="text-[11.5px]">
              Free showcase —{' '}
              <Link to="/marketplace" className="text-foreground font-semibold hover:underline">
                visit the Marketplace
              </Link>{' '}
              for paid assets and templates.
            </div>
          </div>
          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Add your game
            </Link>
          )}
        </div>

        {/* Segmented genre bar */}
        <div className="border border-border bg-card overflow-x-auto">
          <div className="flex divide-x divide-border min-w-max">
            {GAME_GENRES.map((g) => {
              const active = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`flex-1 px-4 h-9 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>

              {remaining > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="inline-flex items-center px-4 h-9 border border-border bg-card text-foreground text-[12px] font-semibold hover:border-foreground hover:bg-accent transition-colors"
                  >
                    Load more ({remaining} remaining)
                  </button>
                </div>
              )}

              {/* Persistent submit prompt */}
              <div className="mt-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Built something in Godot?
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    Add your game to the showcase and get discovered by other devs.
                  </p>
                </div>
                <Link
                  to={user ? '/dashboard' : '/signup'}
                  className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  Add your game
                </Link>
              </div>
            </>
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
