create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cover_image text,
  cover_storage_path text,
  intro text,
  description text,
  status text not null default 'Available',
  schedule text not null default '',
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profiles (name, slug, status, schedule, sort_order)
values
  ('Luna', 'luna', 'Available', 'Tonight' || chr(10) || '7 PM - 2 AM', 1),
  ('Vivian', 'vivian', 'On Duty', 'Friday' || chr(10) || '8 PM - 3 AM', 2),
  ('Mia', 'mia', 'Away', 'Saturday' || chr(10) || '10 PM - Late', 3)
on conflict (slug) do nothing;

alter table public.albums
add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

update public.albums
set profile_id = (select id from public.profiles where slug = 'luna')
where profile_id is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'albums_slug_key'
      and conrelid = 'public.albums'::regclass
  ) then
    alter table public.albums drop constraint albums_slug_key;
  end if;
end $$;

alter table public.albums
alter column profile_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'albums_profile_id_slug_key'
      and conrelid = 'public.albums'::regclass
  ) then
    alter table public.albums add constraint albums_profile_id_slug_key unique (profile_id, slug);
  end if;
end $$;

update public.site_assets
set asset_type = case
  when asset_type = 'decorative_object' then 'decorative_asset'
  when asset_type = 'grain_overlay' then 'grain_layer'
  when asset_type = 'homepage_asset' then 'hero_image'
  else 'future_asset'
end
where asset_type not in (
  'hero_image',
  'hero_polaroid',
  'background_texture',
  'decorative_asset',
  'overlay',
  'grain_layer',
  'floating_object',
  'future_asset'
);

alter table public.site_assets
drop constraint if exists site_assets_asset_type_check;

alter table public.site_assets
add constraint site_assets_asset_type_check
check (
  asset_type in (
    'hero_image',
    'hero_polaroid',
    'background_texture',
    'decorative_asset',
    'overlay',
    'grain_layer',
    'floating_object',
    'future_asset'
  )
);

create index if not exists profiles_public_order_idx on public.profiles (enabled, sort_order);
create index if not exists albums_profile_order_idx on public.albums (profile_id, is_published, sort_order);

alter table public.profiles enable row level security;
grant select on table public.profiles to anon, authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

drop policy if exists "Public can read enabled profiles" on public.profiles;
create policy "Public can read enabled profiles"
on public.profiles
for select
to anon, authenticated
using (enabled);

drop policy if exists "Public can read published albums" on public.albums;
create policy "Public can read published albums"
on public.albums
for select
to anon, authenticated
using (
  is_published
  and exists (
    select 1
    from public.profiles
    where profiles.id = albums.profile_id
      and profiles.enabled
  )
);

drop policy if exists "Public can read media from published albums" on public.album_media;
create policy "Public can read media from published albums"
on public.album_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.albums
    join public.profiles on profiles.id = albums.profile_id
    where albums.id = album_media.album_id
      and albums.is_published
      and profiles.enabled
  )
);

insert into public.albums (profile_id, slug, title, sort_order)
values
  ((select id from public.profiles where slug = 'luna'), 'pink-hour', 'Pink Hour', 1),
  ((select id from public.profiles where slug = 'luna'), 'room-888', 'Room 888', 2),
  ((select id from public.profiles where slug = 'luna'), 'champagne-night', 'Champagne Night', 3),
  ((select id from public.profiles where slug = 'vivian'), 'summer-2026', 'Summer 2026', 1)
on conflict (profile_id, slug) do nothing;
