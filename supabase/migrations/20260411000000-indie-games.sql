-- Create indie_games table
create table if not exists public.indie_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  genre text,
  thumbnail_url text,
  external_url text not null,
  external_platform text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.indie_games enable row level security;

-- Anyone can read published games
create policy "Public can read indie games"
  on public.indie_games for select
  using (true);

-- Users can insert their own games
create policy "Users can insert own games"
  on public.indie_games for insert
  with check (auth.uid() = user_id);

-- Users can update their own games
create policy "Users can update own games"
  on public.indie_games for update
  using (auth.uid() = user_id);

-- Users can delete their own games
create policy "Users can delete own games"
  on public.indie_games for delete
  using (auth.uid() = user_id);
