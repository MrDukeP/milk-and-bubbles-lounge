Milk & Bubbles Lounge

A Next.js, TypeScript, Tailwind, and Supabase build for a public atmosphere site where Moments flow through profiles, with a lightweight single-admin backend.

## Local

```bash
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the public site uses seed content so the routes can be reviewed immediately.

## Admin

Set:

```bash
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Then visit `/admin`.

## Supabase

Run the SQL files in `supabase/migrations` in timestamp order, then set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=milk-bubbles-moments
```

The app also supports legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names.

## Site Assets

Site assets are typed records, not a loose upload dump. Each row in `site_assets` must use one of:

`hero_image`, `hero_polaroid`, `background_texture`, `decorative_asset`, `floating_object`, `overlay`, `grain_layer`, `future_asset`.

Each site asset stores `enabled`, `sort_order`, `alt_text`, `asset_type`, `mobile_visibility`, and `desktop_visibility`. Uploaded files are stored under `site-assets/<asset_type>/...` in Supabase Storage.
