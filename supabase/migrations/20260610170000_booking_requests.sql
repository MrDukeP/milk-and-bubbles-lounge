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

create index if not exists booking_requests_created_idx on public.booking_requests (created_at desc);
create index if not exists booking_requests_status_idx on public.booking_requests (status, created_at desc);

alter table public.booking_requests enable row level security;
grant select, insert, update, delete on table public.booking_requests to service_role;

update public.profiles
set
  cover_image = '/assets/milk-bubbles/luna-polaroid-portrait.jpg',
  intro = 'Private evenings. Warm light. Quiet rooms.',
  status = 'On Duty',
  schedule = 'Today' || chr(10) || '8 PM - 2 AM',
  enabled = true
where slug = 'luna';

update public.profiles
set enabled = false
where slug in ('vivian', 'mia');

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
