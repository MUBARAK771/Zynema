create table if not exists public.watchlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('movie', 'show')),
  item_id text not null,
  title text not null,
  year text not null,
  poster_image text,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

alter table public.watchlist_items enable row level security;

drop policy if exists "Users can read their own watchlist" on public.watchlist_items;
create policy "Users can read their own watchlist"
  on public.watchlist_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add to their own watchlist" on public.watchlist_items;
create policy "Users can add to their own watchlist"
  on public.watchlist_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own watchlist" on public.watchlist_items;
create policy "Users can update their own watchlist"
  on public.watchlist_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove from their own watchlist" on public.watchlist_items;
create policy "Users can remove from their own watchlist"
  on public.watchlist_items for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.watchlist_items to authenticated;
revoke all on public.watchlist_items from anon;
