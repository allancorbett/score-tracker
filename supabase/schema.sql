-- Whist Score Keeper Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Create all tables first
-- ============================================

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Games table
create table public.games (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete set null
);

-- Game Players (links users to games, or stores name-only players)
create table public.game_players (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  player_name text not null,
  player_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(game_id, player_order)
);

-- Sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_complete boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scores table (one row per player per round)
create table public.scores (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  game_player_id uuid references public.game_players(id) on delete cascade not null,
  round_number int not null check (round_number >= 1 and round_number <= 7),
  tricks_won int not null check (tricks_won >= 0 and tricks_won <= 7),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, game_player_id, round_number)
);

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.sessions enable row level security;
alter table public.scores enable row level security;

-- ============================================
-- STEP 3: Create RLS policies
-- ============================================

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Games policies
create policy "Users can view games they're part of"
  on public.games for select
  using (
    exists (
      select 1 from public.game_players
      where game_players.game_id = games.id
      and game_players.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create games"
  on public.games for insert
  with check (auth.uid() is not null);

create policy "Game members can update game"
  on public.games for update
  using (
    exists (
      select 1 from public.game_players
      where game_players.game_id = games.id
      and game_players.user_id = auth.uid()
    )
  );

-- Game Players policies
create policy "Users can view players in their games"
  on public.game_players for select
  using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = game_players.game_id
      and gp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can add players to games"
  on public.game_players for insert
  with check (auth.uid() is not null);

-- Sessions policies
create policy "Users can view sessions in their games"
  on public.sessions for select
  using (
    exists (
      select 1 from public.game_players
      where game_players.game_id = sessions.game_id
      and game_players.user_id = auth.uid()
    )
  );

create policy "Game members can create sessions"
  on public.sessions for insert
  with check (
    exists (
      select 1 from public.game_players
      where game_players.game_id = sessions.game_id
      and game_players.user_id = auth.uid()
    )
  );

create policy "Game members can update sessions"
  on public.sessions for update
  using (
    exists (
      select 1 from public.game_players
      where game_players.game_id = sessions.game_id
      and game_players.user_id = auth.uid()
    )
  );

-- Scores policies
create policy "Users can view scores in their games"
  on public.scores for select
  using (
    exists (
      select 1 from public.sessions s
      join public.game_players gp on gp.game_id = s.game_id
      where s.id = scores.session_id
      and gp.user_id = auth.uid()
    )
  );

create policy "Game members can insert scores"
  on public.scores for insert
  with check (
    exists (
      select 1 from public.sessions s
      join public.game_players gp on gp.game_id = s.game_id
      where s.id = scores.session_id
      and gp.user_id = auth.uid()
    )
  );

create policy "Game members can update scores"
  on public.scores for update
  using (
    exists (
      select 1 from public.sessions s
      join public.game_players gp on gp.game_id = s.game_id
      where s.id = scores.session_id
      and gp.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: Create functions and triggers
-- ============================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger on_scores_updated
  before update on public.scores
  for each row execute procedure public.handle_updated_at();

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', 'Player'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- STEP 5: Create views and indexes
-- ============================================

-- Useful views
create or replace view public.game_standings as
select
  gp.game_id,
  gp.id as game_player_id,
  gp.player_name,
  gp.user_id,
  coalesce(sum(sc.tricks_won), 0) as total_tricks,
  count(distinct s.id) as sessions_played
from public.game_players gp
left join public.sessions s on s.game_id = gp.game_id and s.is_complete = true
left join public.scores sc on sc.game_player_id = gp.id and sc.session_id = s.id
group by gp.game_id, gp.id, gp.player_name, gp.user_id;

-- Indexes for performance
create index idx_scores_session_id on public.scores(session_id);
create index idx_scores_game_player_id on public.scores(game_player_id);
create index idx_sessions_game_id on public.sessions(game_id);
create index idx_game_players_game_id on public.game_players(game_id);
create index idx_game_players_user_id on public.game_players(user_id);
