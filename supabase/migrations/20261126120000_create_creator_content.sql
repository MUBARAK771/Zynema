create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  searchable boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

drop policy if exists "Public can find opted-in creator profiles" on public.creator_profiles;
create policy "Public can find opted-in creator profiles"
  on public.creator_profiles for select
  to anon, authenticated
  using (searchable or auth.uid() = user_id);

drop policy if exists "Users can create their own creator profile" on public.creator_profiles;
create policy "Users can create their own creator profile"
  on public.creator_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own creator profile" on public.creator_profiles;
create policy "Users can update their own creator profile"
  on public.creator_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.creator_profiles to anon, authenticated;
grant insert, update on public.creator_profiles to authenticated;

create or replace function public.search_creator_profiles(search_query text)
returns table (user_id uuid, display_name text)
language sql
stable
security invoker
set search_path = public
as $$
  select profile.user_id, profile.display_name
  from public.creator_profiles as profile
  where profile.searchable
    and profile.display_name ilike
      '%' ||
      replace(
        replace(
          replace(search_query, E'\\', E'\\\\'),
          '%',
          E'\\%'
        ),
        '_',
        E'\\_'
      ) ||
      '%'
      escape E'\\'
  order by profile.display_name
  limit 6;
$$;

revoke all on function public.search_creator_profiles(text) from public;
grant execute on function public.search_creator_profiles(text) to authenticated;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  object_path text not null unique,
  mime_type text not null check (mime_type in ('video/mp4', 'video/webm', 'video/quicktime')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  created_at timestamptz not null default now(),
  constraint videos_object_path_owner check (split_part(object_path, '/', 1) = user_id::text)
);

alter table public.videos enable row level security;

drop policy if exists "Public can view uploaded videos" on public.videos;
create policy "Public can view uploaded videos"
  on public.videos for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can upload their own videos" on public.videos;
create policy "Users can upload their own videos"
  on public.videos for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own videos" on public.videos;
create policy "Users can remove their own videos"
  on public.videos for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.videos to anon, authenticated;
grant insert, delete on public.videos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-videos',
  'user-videos',
  true,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload videos to their own folder" on storage.objects;
create policy "Users can upload videos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete videos from their own folder" on storage.objects;
create policy "Users can delete videos from their own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
