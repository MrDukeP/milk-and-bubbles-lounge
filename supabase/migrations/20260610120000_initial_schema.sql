create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id boolean primary key default true,
  hero_note text not null default '',
  moments_note text not null default '',
  footer_line text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.tonight_schedule (
  id uuid primary key default gen_random_uuid(),
  display_time text not null,
  label text not null,
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (
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
  ),
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  url text not null,
  storage_path text,
  alt_text text not null default '',
  sort_order integer not null default 100,
  enabled boolean not null default true,
  mobile_visibility boolean not null default true,
  desktop_visibility boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  title text not null,
  note text,
  album_date date,
  cover_url text,
  sort_order integer not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, slug)
);

create table if not exists public.album_media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  url text not null,
  storage_path text,
  alt text not null default '',
  sort_order integer not null default 100,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_slug text not null,
  album_slug text,
  date date not null,
  time text not null,
  duration text not null check (duration in ('1 hour', '2 hours', '3 hours', 'Overnight')),
  contact text not null,
  message text,
  visitor_ip text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived'))
);

create index if not exists tonight_schedule_order_idx on public.tonight_schedule (sort_order);
create index if not exists notes_order_idx on public.notes (sort_order);
create index if not exists site_assets_type_order_idx on public.site_assets (asset_type, enabled, sort_order);
create index if not exists profiles_public_order_idx on public.profiles (enabled, sort_order);
create index if not exists albums_public_order_idx on public.albums (is_published, sort_order);
create index if not exists album_media_album_order_idx on public.album_media (album_id, sort_order);
create index if not exists booking_requests_created_idx on public.booking_requests (created_at desc);
create index if not exists booking_requests_status_idx on public.booking_requests (status, created_at desc);

alter table public.site_settings enable row level security;
alter table public.tonight_schedule enable row level security;
alter table public.notes enable row level security;
alter table public.site_assets enable row level security;
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.album_media enable row level security;
alter table public.booking_requests enable row level security;

grant select on table public.site_settings to anon, authenticated;
grant select on table public.tonight_schedule to anon, authenticated;
grant select on table public.notes to anon, authenticated;
grant select on table public.site_assets to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.albums to anon, authenticated;
grant select on table public.album_media to anon, authenticated;

grant select, insert, update, delete on table public.site_settings to service_role;
grant select, insert, update, delete on table public.tonight_schedule to service_role;
grant select, insert, update, delete on table public.notes to service_role;
grant select, insert, update, delete on table public.site_assets to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.albums to service_role;
grant select, insert, update, delete on table public.album_media to service_role;
grant select, insert, update, delete on table public.booking_requests to service_role;

create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "Public can read visible schedule"
on public.tonight_schedule
for select
to anon, authenticated
using (is_visible);

create policy "Public can read visible notes"
on public.notes
for select
to anon, authenticated
using (is_visible);

create policy "Public can read enabled site assets"
on public.site_assets
for select
to anon, authenticated
using (enabled);

create policy "Public can read enabled profiles"
on public.profiles
for select
to anon, authenticated
using (enabled);

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

insert into public.tonight_schedule (display_time, label, sort_order)
values
  ('9 PM', 'Doors Open', 1),
  ('11 PM', 'Pink Hour', 2),
  ('1 AM', 'Last Call', 3)
on conflict do nothing;

insert into public.profiles (name, slug, cover_image, intro, status, schedule, sort_order, enabled)
values
  (
    'Luna',
    'luna',
    '/assets/milk-bubbles/luna-polaroid-portrait.jpg',
    'Private evenings. Warm light. Quiet rooms.',
    'On Duty',
    'Today' || chr(10) || '8 PM - 2 AM',
    1,
    true
  ),
  ('Vivian', 'vivian', null, null, 'On Duty', 'Friday' || chr(10) || '8 PM - 3 AM', 2, false),
  ('Mia', 'mia', null, null, 'Away', 'Saturday' || chr(10) || '10 PM - Late', 3, false)
on conflict (slug) do nothing;

insert into public.albums (profile_id, slug, title, sort_order)
values
  ((select id from public.profiles where slug = 'luna'), 'pink-hour', 'Pink Hour', 1),
  ((select id from public.profiles where slug = 'luna'), 'room-888', 'Room 888', 2),
  ((select id from public.profiles where slug = 'luna'), 'champagne-night', 'Champagne Night', 3),
  ((select id from public.profiles where slug = 'vivian'), 'summer-2026', 'Summer 2026', 1)
on conflict (profile_id, slug) do nothing;

insert into public.album_media (id, album_id, media_type, url, alt, sort_order, is_cover)
values
  (
    '00000000-0000-4000-8000-000000000101',
    (select id from public.albums where slug = 'pink-hour' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-pink-hour-01.jpg',
    '',
    1,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    (select id from public.albums where slug = 'pink-hour' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-cover.jpg',
    '',
    2,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    (select id from public.albums where slug = 'pink-hour' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-polaroid.jpg',
    '',
    3,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    (select id from public.albums where slug = 'pink-hour' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-polaroid-portrait.jpg',
    '',
    4,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000201',
    (select id from public.albums where slug = 'room-888' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/room-888-wide.jpg',
    '',
    1,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    (select id from public.albums where slug = 'room-888' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-cover.jpg',
    '',
    2,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    (select id from public.albums where slug = 'room-888' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-polaroid-alt.jpg',
    '',
    3,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000301',
    (select id from public.albums where slug = 'champagne-night' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-cover.jpg',
    '',
    1,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    (select id from public.albums where slug = 'champagne-night' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/room-888-wide.jpg',
    '',
    2,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000303',
    (select id from public.albums where slug = 'champagne-night' and profile_id = (select id from public.profiles where slug = 'luna')),
    'image',
    '/assets/milk-bubbles/luna-polaroid-portrait.jpg',
    '',
    3,
    false
  )
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('milk-bubbles-moments', 'milk-bubbles-moments', true)
on conflict (id) do nothing;

create policy "Public can read moment files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'milk-bubbles-moments');

create policy "Service role can manage moment files"
on storage.objects
for all
to service_role
using (bucket_id = 'milk-bubbles-moments')
with check (bucket_id = 'milk-bubbles-moments');
