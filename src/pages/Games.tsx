import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2 } from 'lucide-react';

const PAGE_SIZE = 24;

// Matches the genres in DashboardProjectNew — projects with classification='game'
// are filtered by these values.
const GENRES = [
  'All',
  'Action', 'Adventure', 'Card Game', 'Fighting', 'Interactive Fiction',
  'Platformer', 'Puzzle', 'Racing', 'Rhythm', 'Role Playing',
  'Shooter', 'Simulation', 'Sports', 'Strategy', 'Survival',
  'Visual Novel', 'Other',
];

function usePublishedGames(genre?: string) {
  return useQuery({
    queryKey: ['published-games', genre],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id, title, slug, short_description, cover_image_url, genre, tags, creator_id, creators(id, username, display_name)')
        .eq('status', 'published')
        .eq('classification', 'game')
        .order('created_at', { ascending: false });

      if (genre && genre !== 'All') {
        query = query.eq('genre', genre);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

// ── Game card ──────────────────────────────────────────────────────────────────

function GameProjectCard({ project }: { project: any }) {
  const creator = project.creators;
  return (
    <Link to={`/projects/${project.slug}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#ccc] transition-all">
        <div className="aspect-video bg-[#111] overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-[#444]" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-[13px] font-semibold truncate">{project.title}</p>
          {creator && (
            <p className="text-[11px] text-muted-foreground">
              by {creator.display_name || creator.username}
            </p>
          )}
          {project.genre && project.genre !== 'No genre' && (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555] mt-1">
              {project.genre}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [genre, setGenre]               = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: games, isLoading }      = usePublishedGames(genre);
  const { user }                        = useAuth();

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [genre]);

  const visibleGames = games?.slice(0, visibleCount) ?? [];
  const remaining    = (games?.length ?? 0) - visibleGames.length;

  const addButton = user ? (
    <Link
      to="/dashboard/projects/new"
      className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
    >
      Add your game
    </Link>
  ) : (
    <Link
      to="/signup"
      className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
    >
      Sign up to add your game
    </Link>
  );

  return (
    <MainLayout fullWidth>
      <div className="w-full space-y-4">

        {/* Slim info strip */}
        <div className="text-[12.5px] text-muted-foreground border-b border-border pb-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div>
              Indie games — discover and play what the community is building.
            </div>
            <div className="text-[11.5px]">
              Free showcase —{' '}
              <Link to="/marketplace" className="text-foreground font-semibold hover:underline">
                visit the Marketplace
              </Link>{' '}
              for paid assets and templates.
            </div>
          </div>
          {addButton}
        </div>

        {/* Genre bar */}
        <div className="border border-border bg-card overflow-x-auto [mask-image:linear-gradient(to_right,black_90%,transparent)]">
          <div className="flex divide-x divide-border min-w-max">
            {GENRES.map((g) => {
              const active = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-4 h-9 text-[12px] font-semibold whitespace-nowrap transition-colors ${
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
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : games && games.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleGames.map((game) => (
                  <GameProjectCard key={game.id} project={game} />
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

              <div className="mt-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">Built something?</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Create a project page and it'll show up here automatically.
                  </p>
                </div>
                {addButton}
              </div>
            </>
          ) : (
            <div className="border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">No games yet</h3>
                <p className="text-[12px] text-muted-foreground">
                  Publish a project and it'll appear here automatically.
                </p>
              </div>
              {addButton}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
