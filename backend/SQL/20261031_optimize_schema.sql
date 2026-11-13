-- wiiw: alineación completa del esquema con el código de la app
-- Ejecutar en el SQL Editor de Supabase o con psql.
-- Es idempotente: se puede ejecutar más de una vez.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  title text,
  description text,
  cover_url text,
  language text,
  genre text,
  main_character text,
  target_audience text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  audience text,
  characters text,
  views_count bigint not null default 0
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  chapter_number integer not null default 1,
  title text,
  content text,
  allow_comments boolean not null default true,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  target_id uuid,
  target_type text,
  story_id uuid references public.stories(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  target_id uuid,
  target_type text,
  comment_text text,
  story_id uuid references public.stories(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  target_id uuid,
  target_type text,
  story_id uuid references public.stories(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.stories add column if not exists characters text;
alter table public.stories add column if not exists views_count bigint not null default 0;

alter table public.chapters add column if not exists status text not null default 'draft';
alter table public.chapters add column if not exists updated_at timestamptz not null default now();

alter table public.ideas add column if not exists content text;
alter table public.ideas add column if not exists updated_at timestamptz not null default now();

alter table public.likes add column if not exists story_id uuid;
alter table public.likes add column if not exists idea_id uuid;

alter table public.comments add column if not exists story_id uuid;
alter table public.comments add column if not exists chapter_id uuid;
alter table public.comments add column if not exists idea_id uuid;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists updated_at timestamptz not null default now();

alter table public.saved_items add column if not exists story_id uuid;
alter table public.saved_items add column if not exists idea_id uuid;
alter table public.saved_items add column if not exists updated_at timestamptz not null default now();

alter table public.likes alter column target_type drop not null;
alter table public.likes alter column target_id drop not null;
alter table public.saved_items alter column target_type drop not null;
alter table public.saved_items alter column target_id drop not null;
alter table public.comments alter column target_type drop not null;
alter table public.comments alter column target_id drop not null;
alter table public.comments alter column comment_text drop not null;

update public.stories
set characters = coalesce(characters, main_character)
where characters is null and main_character is not null;

update public.stories
set audience = coalesce(audience, target_audience)
where audience is null and target_audience is not null;

update public.comments
set content = comment_text
where content is null and comment_text is not null;

update public.likes
set story_id = target_id
where story_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('story', 'stories', 'historia', 'historias');

update public.likes
set idea_id = target_id
where story_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('idea', 'ideas');

update public.comments
set story_id = target_id
where story_id is null and chapter_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('story', 'stories', 'historia', 'historias');

update public.comments
set idea_id = target_id
where story_id is null and chapter_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('idea', 'ideas');

update public.saved_items
set story_id = target_id
where story_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('story', 'stories', 'historia', 'historias');

update public.saved_items
set idea_id = target_id
where story_id is null and idea_id is null and target_id is not null and lower(coalesce(target_type, '')) in ('idea', 'ideas');

update public.likes
set target_id = null, target_type = null
where target_id is not null
  and (story_id = target_id or idea_id = target_id);

update public.saved_items
set target_id = null, target_type = null
where target_id is not null
  and (story_id = target_id or idea_id = target_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'likes_story_id_fkey' and conrelid = 'public.likes'::regclass) then
    alter table public.likes add constraint likes_story_id_fkey
      foreign key (story_id) references public.stories(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'likes_idea_id_fkey' and conrelid = 'public.likes'::regclass) then
    alter table public.likes add constraint likes_idea_id_fkey
      foreign key (idea_id) references public.ideas(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comments_story_id_fkey' and conrelid = 'public.comments'::regclass) then
    alter table public.comments add constraint comments_story_id_fkey
      foreign key (story_id) references public.stories(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comments_chapter_id_fkey' and conrelid = 'public.comments'::regclass) then
    alter table public.comments add constraint comments_chapter_id_fkey
      foreign key (chapter_id) references public.chapters(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comments_idea_id_fkey' and conrelid = 'public.comments'::regclass) then
    alter table public.comments add constraint comments_idea_id_fkey
      foreign key (idea_id) references public.ideas(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'saved_items_story_id_fkey' and conrelid = 'public.saved_items'::regclass) then
    alter table public.saved_items add constraint saved_items_story_id_fkey
      foreign key (story_id) references public.stories(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'saved_items_idea_id_fkey' and conrelid = 'public.saved_items'::regclass) then
    alter table public.saved_items add constraint saved_items_idea_id_fkey
      foreign key (idea_id) references public.ideas(id) on delete cascade not valid;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stories_status_check' and conrelid = 'public.stories'::regclass) then
    alter table public.stories add constraint stories_status_check
      check (status in ('draft', 'published')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'chapters_status_check' and conrelid = 'public.chapters'::regclass) then
    alter table public.chapters add constraint chapters_status_check
      check (status in ('draft', 'published')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'stories_views_count_nonnegative' and conrelid = 'public.stories'::regclass) then
    alter table public.stories add constraint stories_views_count_nonnegative
      check (views_count >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'likes_one_target' and conrelid = 'public.likes'::regclass) then
    alter table public.likes add constraint likes_one_target
      check (num_nonnulls(story_id, idea_id, target_id) = 1) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'saved_items_one_target' and conrelid = 'public.saved_items'::regclass) then
    alter table public.saved_items add constraint saved_items_one_target
      check (num_nonnulls(story_id, idea_id, target_id) = 1) not valid;
  end if;
end $$;

create unique index if not exists likes_user_story_unique on public.likes (user_id, story_id) where story_id is not null;
create unique index if not exists likes_user_idea_unique on public.likes (user_id, idea_id) where idea_id is not null;
create unique index if not exists saved_items_user_story_unique on public.saved_items (user_id, story_id) where story_id is not null;
create unique index if not exists saved_items_user_idea_unique on public.saved_items (user_id, idea_id) where idea_id is not null;
create unique index if not exists chapters_story_number_unique on public.chapters (story_id, chapter_number);

create index if not exists idx_stories_status_created_at on public.stories (status, created_at desc);
create index if not exists idx_stories_author_created_at on public.stories (author_id, created_at desc);
create index if not exists idx_stories_genre on public.stories (genre);
create index if not exists idx_stories_views_count on public.stories (views_count desc);
create index if not exists idx_stories_title_trgm on public.stories using gin (title gin_trgm_ops);
create index if not exists idx_chapters_story_number on public.chapters (story_id, chapter_number);
create index if not exists idx_likes_story_id on public.likes (story_id);
create index if not exists idx_likes_idea_id on public.likes (idea_id);
create index if not exists idx_likes_user_id on public.likes (user_id);
create index if not exists idx_comments_story_id on public.comments (story_id);
create index if not exists idx_comments_chapter_id on public.comments (chapter_id);
create index if not exists idx_comments_idea_id on public.comments (idea_id);
create index if not exists idx_comments_user_id on public.comments (user_id);
create index if not exists idx_comments_created_at on public.comments (created_at desc);
create index if not exists idx_ideas_created_at on public.ideas (created_at desc);
create index if not exists idx_ideas_author_id on public.ideas (author_id);
create index if not exists idx_saved_items_user_id on public.saved_items (user_id);
create index if not exists idx_saved_items_story_id on public.saved_items (story_id);
create index if not exists idx_saved_items_idea_id on public.saved_items (idea_id);
create index if not exists idx_profiles_username on public.profiles (username);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_stories_updated_at on public.stories;
create trigger set_stories_updated_at before update on public.stories
for each row execute function public.set_updated_at();

drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at before update on public.chapters
for each row execute function public.set_updated_at();

drop trigger if exists set_ideas_updated_at on public.ideas;
create trigger set_ideas_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_items_updated_at on public.saved_items;
create trigger set_saved_items_updated_at before update on public.saved_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))), '');
  if base_username is null then
    base_username := 'lector';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    final_username,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_story_views(p_story_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.stories
  set views_count = views_count + 1
  where id = p_story_id
    and status = 'published'
  returning views_count;
$$;

revoke all on function public.increment_story_views(uuid) from public;
grant execute on function public.increment_story_views(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.chapters enable row level security;
alter table public.ideas enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_items enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists stories_select_published_or_own on public.stories;
create policy stories_select_published_or_own on public.stories for select
using (status = 'published' or auth.uid() = author_id);

drop policy if exists stories_insert_own on public.stories;
create policy stories_insert_own on public.stories for insert with check (auth.uid() = author_id);

drop policy if exists stories_update_own on public.stories;
create policy stories_update_own on public.stories for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists stories_delete_own on public.stories;
create policy stories_delete_own on public.stories for delete using (auth.uid() = author_id);

drop policy if exists chapters_select_published_or_own on public.chapters;
create policy chapters_select_published_or_own on public.chapters for select
using (
  status = 'published'
  or exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.author_id = auth.uid()
  )
);

drop policy if exists chapters_insert_own on public.chapters;
create policy chapters_insert_own on public.chapters for insert
with check (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.author_id = auth.uid()
  )
);

drop policy if exists chapters_update_own on public.chapters;
create policy chapters_update_own on public.chapters for update
using (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.author_id = auth.uid()
  )
);

drop policy if exists chapters_delete_own on public.chapters;
create policy chapters_delete_own on public.chapters for delete
using (
  exists (
    select 1 from public.stories s
    where s.id = chapters.story_id and s.author_id = auth.uid()
  )
);

drop policy if exists likes_select_all on public.likes;
create policy likes_select_all on public.likes for select using (true);

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own on public.likes for insert with check (auth.uid() = user_id);

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes for delete using (auth.uid() = user_id);

drop policy if exists comments_select_public on public.comments;
create policy comments_select_public on public.comments for select
using (
  auth.uid() = user_id
  or story_id is null
  or exists (
    select 1 from public.stories s
    where s.id = comments.story_id and s.status = 'published'
  )
);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments for delete using (auth.uid() = user_id);

drop policy if exists ideas_select_all on public.ideas;
create policy ideas_select_all on public.ideas for select using (true);

drop policy if exists ideas_insert_own on public.ideas;
create policy ideas_insert_own on public.ideas for insert with check (auth.uid() = author_id);

drop policy if exists ideas_update_own on public.ideas;
create policy ideas_update_own on public.ideas for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists ideas_delete_own on public.ideas;
create policy ideas_delete_own on public.ideas for delete using (auth.uid() = author_id);

drop policy if exists saved_items_select_own on public.saved_items;
create policy saved_items_select_own on public.saved_items for select using (auth.uid() = user_id);

drop policy if exists saved_items_insert_own on public.saved_items;
create policy saved_items_insert_own on public.saved_items for insert with check (auth.uid() = user_id);

drop policy if exists saved_items_update_own on public.saved_items;
create policy saved_items_update_own on public.saved_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists saved_items_delete_own on public.saved_items;
create policy saved_items_delete_own on public.saved_items for delete using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.stories, public.chapters, public.ideas, public.likes, public.comments, public.saved_items to anon, authenticated;
grant insert, update, delete on public.profiles, public.stories, public.chapters, public.ideas, public.likes, public.comments, public.saved_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_covers_read on storage.objects;
create policy storage_covers_read on storage.objects for select using (bucket_id = 'covers');

drop policy if exists storage_covers_insert on storage.objects;
create policy storage_covers_insert on storage.objects for insert to authenticated
with check (bucket_id = 'covers');

drop policy if exists storage_covers_update on storage.objects;
create policy storage_covers_update on storage.objects for update to authenticated
using (bucket_id = 'covers') with check (bucket_id = 'covers');

drop policy if exists storage_covers_delete on storage.objects;
create policy storage_covers_delete on storage.objects for delete to authenticated
using (bucket_id = 'covers');

drop policy if exists storage_avatars_read on storage.objects;
create policy storage_avatars_read on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists storage_avatars_insert on storage.objects;
create policy storage_avatars_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_avatars_update on storage.objects;
create policy storage_avatars_update on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_avatars_delete on storage.objects;
create policy storage_avatars_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
