import { cache } from "react";

import { seedContent } from "./seed";
import { isSiteAssetType } from "./site-assets";
import { getPublicSupabase } from "./supabase";
import type { Album, AlbumMedia, Note, Profile, ScheduleItem, SiteAsset, SiteContent, SiteSettings } from "./types";

type RawSiteAsset = {
  id: string;
  asset_type: string;
  media_type: "image" | "video";
  url: string;
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number | null;
  enabled: boolean | null;
  mobile_visibility: boolean | null;
  desktop_visibility: boolean | null;
};

type RawMedia = {
  id: string;
  album_id: string;
  media_type: "image" | "video";
  url: string;
  storage_path: string | null;
  alt: string | null;
  sort_order: number | null;
  is_cover: boolean | null;
};

type RawAlbum = {
  id: string;
  profile_id: string;
  slug: string;
  title: string;
  note: string | null;
  album_date: string | null;
  cover_url: string | null;
  sort_order: number | null;
  is_published: boolean | null;
  album_media?: RawMedia[];
};

type RawProfile = {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  cover_storage_path: string | null;
  intro: string | null;
  description: string | null;
  status: string | null;
  schedule: string | null;
  sort_order: number | null;
  enabled: boolean | null;
  albums?: RawAlbum[];
};

const byOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

function mapSiteAssets(rows: RawSiteAsset[] | null): SiteAsset[] {
  if (!rows?.length) return seedContent.assets;

  return byOrder(
    rows.flatMap((row) => {
      if (!isSiteAssetType(row.asset_type)) return [];

      return {
        id: row.id,
        assetType: row.asset_type,
        mediaType: row.media_type,
        url: row.url,
        storagePath: row.storage_path ?? undefined,
        altText: row.alt_text ?? "",
        sortOrder: row.sort_order ?? 0,
        enabled: Boolean(row.enabled ?? true),
        mobileVisibility: Boolean(row.mobile_visibility ?? true),
        desktopVisibility: Boolean(row.desktop_visibility ?? true),
      };
    }),
  ).filter((asset) => asset.enabled && asset.url);
}

function mapSettings(row: Record<string, unknown> | null): SiteSettings {
  if (!row) return seedContent.settings;

  return {
    heroNote: String(row.hero_note ?? seedContent.settings.heroNote),
    momentsNote: String(row.moments_note ?? seedContent.settings.momentsNote),
    footerLine: String(row.footer_line ?? seedContent.settings.footerLine),
  };
}

function mapSchedule(rows: Record<string, unknown>[] | null): ScheduleItem[] {
  if (!rows?.length) return seedContent.schedule;

  return byOrder(
    rows.map((row) => ({
      id: String(row.id),
      displayTime: String(row.display_time ?? ""),
      label: String(row.label ?? ""),
      sortOrder: Number(row.sort_order ?? 0),
      isVisible: Boolean(row.is_visible ?? true),
    })),
  ).filter((item) => item.isVisible && item.displayTime && item.label);
}

function mapNotes(rows: Record<string, unknown>[] | null): Note[] {
  if (!rows?.length) return seedContent.notes;

  return byOrder(
    rows.map((row) => ({
      id: String(row.id),
      text: String(row.text ?? ""),
      sortOrder: Number(row.sort_order ?? 0),
      isVisible: Boolean(row.is_visible ?? true),
    })),
  ).filter((note) => note.isVisible && note.text);
}

function mapMedia(media: RawMedia[] | undefined): AlbumMedia[] {
  return byOrder(
    (media ?? []).map((item) => ({
      id: item.id,
      albumId: item.album_id,
      mediaType: item.media_type,
      url: item.url,
      storagePath: item.storage_path ?? undefined,
      alt: item.alt ?? "",
      sortOrder: item.sort_order ?? 0,
      isCover: Boolean(item.is_cover),
    })),
  );
}

function mapAlbums(rows: RawAlbum[] | undefined): Album[] {
  return byOrder(
    (rows ?? []).map((row) => {
      const albumMedia = mapMedia(row.album_media);
      const cover = row.cover_url ?? albumMedia.find((item) => item.isCover)?.url ?? albumMedia[0]?.url;

      return {
        id: row.id,
        profileId: row.profile_id,
        slug: row.slug,
        title: row.title,
        note: row.note ?? undefined,
        albumDate: row.album_date ?? undefined,
        coverUrl: cover,
        sortOrder: row.sort_order ?? 0,
        isPublished: Boolean(row.is_published ?? true),
        media: albumMedia,
      };
    }),
  ).filter((album) => album.isPublished);
}

function mapProfiles(rows: RawProfile[] | null): Profile[] {
  if (!rows?.length) return seedContent.profiles;

  return byOrder(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      coverImage: row.cover_image ?? undefined,
      coverStoragePath: row.cover_storage_path ?? undefined,
      intro: row.intro ?? undefined,
      description: row.description ?? undefined,
      status: row.status ?? "Available",
      schedule: row.schedule ?? "",
      sortOrder: row.sort_order ?? 0,
      enabled: Boolean(row.enabled ?? true),
      albums: mapAlbums(row.albums),
    })),
  ).filter((profile) => profile.enabled);
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const supabase = getPublicSupabase();

  if (!supabase) {
    return seedContent;
  }

  const [settingsResult, assetsResult, scheduleResult, notesResult, profilesResult] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("site_assets").select("*").eq("enabled", true).order("sort_order", { ascending: true }),
    supabase.from("tonight_schedule").select("*").order("sort_order", { ascending: true }),
    supabase.from("notes").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("profiles")
      .select("*, albums(*, album_media(*))")
      .eq("enabled", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (settingsResult.error || scheduleResult.error || notesResult.error || profilesResult.error) {
    return seedContent;
  }

  const profiles = mapProfiles(profilesResult.data as RawProfile[] | null);

  return {
    settings: mapSettings(settingsResult.data),
    assets: assetsResult.error ? seedContent.assets : mapSiteAssets(assetsResult.data as RawSiteAsset[] | null),
    schedule: mapSchedule(scheduleResult.data),
    notes: mapNotes(notesResult.data),
    profiles,
    albums: profiles.flatMap((profile) => profile.albums),
    bookingRequests: [],
  };
});

export async function getProfileBySlug(slug: string) {
  const content = await getSiteContent();
  return content.profiles.find((profile) => profile.slug === slug);
}

export async function getAlbumBySlug(profileSlug: string, albumSlug: string) {
  const profile = await getProfileBySlug(profileSlug);
  const album = profile?.albums.find((item) => item.slug === albumSlug);
  return album && profile ? { profile, album } : null;
}
