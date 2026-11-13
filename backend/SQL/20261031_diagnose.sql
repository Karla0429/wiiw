select 'profiles' as table_name, count(*) as rows from public.profiles
union all select 'stories', count(*) from public.stories
union all select 'chapters', count(*) from public.chapters
union all select 'ideas', count(*) from public.ideas
union all select 'likes', count(*) from public.likes
union all select 'comments', count(*) from public.comments
union all select 'saved_items', count(*) from public.saved_items
order by table_name;

select tablename, policyname, cmd, roles::text as roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'stories', 'chapters', 'ideas', 'likes', 'comments', 'saved_items')
order by table_name, ordinal_position;

select conrelid::regclass::text as table_name, conname, contype, convalidated
from pg_constraint
where connamespace = 'public'::regnamespace
order by table_name, conname;
