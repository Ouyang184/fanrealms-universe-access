import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useIndieGames, useAddGame, GAME_GENRES } from '@/hooks/useIndieGames';
import { GameCard } from '@/components/games/GameCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_SIZE = 24;

// Detect platform label from URL
function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    if (hostname.endsWith('itch.io'))      return 'itch.io';
    if (hostname === 'github.com')         return 'GitHub';
    if (hostname.endsWith('github.io'))    return 'GitHub';
    if (hostname === 'gamejolt.com')       return 'Game Jolt';
    if (hostname === 'ldjam.com')          return 'Ludum Dare';
    if (hostname === 'newgrounds.com')     return 'Newgrounds';
    return 'Play';
  } catch {
    return 'Play';
  }
}

function isValidUrl(url: string) {
  try { new URL(url); return true; } catch { return false; }
}

// ── Submit game dialog ────────────────────────────────────────────────────────

function SubmitGameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addGame = useAddGame();
  const [title, setTitle]         = useState('');
  const [url, setUrl]             = useState('');
  const [genre, setGenre]         = useState('Other');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [error, setError]         = useState('');

  const reset = () => {
    setTitle(''); setUrl(''); setGenre('Other');
    setDescription(''); setThumbnail(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim())        { setError('Please enter a title.');         return; }
    if (!isValidUrl(url.trim())) { setError('Please enter a valid URL.');  return; }
    if (thumbnail.trim() && !isValidUrl(thumbnail.trim())) {
      setError('Thumbnail URL is not a valid URL.'); return;
    }
    setError('');
    try {
      await addGame.mutateAsync({
        title:             title.trim(),
        external_url:      url.trim(),
        genre,
        description:       description.trim() || undefined,
        thumbnail_url:     thumbnail.trim()   || undefined,
        external_platform: detectPlatform(url.trim()),
      });
      toast.success('Game added to the showcase!');
      handleClose();
    } catch {
      // error toast shown by hook
    }
  };

  const genres = GAME_GENRES.filter(g => g !== 'All');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add your game</DialogTitle>
          <DialogDescription>
            Submit your Godot game to the FanRealms showcase. Paste a link from
            itch.io, GitHub, Game Jolt, or anywhere else it's hosted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#555]">
              Title <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="e.g. Space Crawler"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              maxLength={100}
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#555]">
              Link to play <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="https://yourname.itch.io/your-game"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
            />
          </div>

          {/* Genre */}
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#555]">Genre</label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Thumbnail */}
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#555]">
              Thumbnail URL{' '}
              <span className="text-[#bbb] font-normal">(optional)</span>
            </label>
            <Input
              placeholder="https://img.itch.zone/…/cover.png"
              value={thumbnail}
              onChange={e => { setThumbnail(e.target.value); setError(''); }}
            />
            <p className="text-[11px] text-[#aaa]">
              Paste a direct image URL from itch.io or elsewhere.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-[#555]">
              Short description{' '}
              <span className="text-[#bbb] font-normal">(optional)</span>
            </label>
            <Input
              placeholder="What is your game about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !url.trim() || addGame.isPending}
            className="flex-1"
          >
            {addGame.isPending ? 'Submitting…' : 'Submit game'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [genre, setGenre]               = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showDialog, setShowDialog]     = useState(false);
  const { data: games, isLoading }      = useIndieGames(genre);
  const { user }                        = useAuth();

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [genre]);

  const visibleGames = games?.slice(0, visibleCount) ?? [];
  const remaining    = (games?.length ?? 0) - visibleGames.length;

  const addButton = user ? (
    <button
      type="button"
      onClick={() => setShowDialog(true)}
      className="inline-flex items-center px-3 h-8 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
    >
      Add your game
    </button>
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
          {addButton}
        </div>

        {/* Genre bar */}
        <div className="border border-border bg-card overflow-x-auto [mask-image:linear-gradient(to_right,black_90%,transparent)]">
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

              <div className="mt-6 border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">Built something in Godot?</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Add your game to the showcase and get discovered by other devs.
                  </p>
                </div>
                {addButton}
              </div>
            </>
          ) : (
            <div className="border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">No games listed yet</h3>
                <p className="text-[12px] text-muted-foreground">
                  Showcase your Godot game and get it discovered by other devs.
                </p>
              </div>
              {addButton}
            </div>
          )}
        </section>
      </div>

      <SubmitGameDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </MainLayout>
  );
}
