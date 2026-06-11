import { seedAlbums, seedAssets, seedBookingRequests, seedNotes, seedProfiles, seedSchedule, seedSettings } from "./seed";
import { isSiteAssetType } from "./site-assets";
import { getAdminSupabase } from "./supabase";
import type { Album, AlbumMedia, BookingRequest, BookingStatus, Note, Profile, ScheduleItem, SiteAsset, SiteContent } from "./types";

type RawAdminSiteAsset = {
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

type RawAdminProfile = {
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
  albums?: RawAdminAlbum[];
};

type RawAdminAlbum = {
  id: string;
  profile_id: string;
  slug: string;
  title: string;
  note: string | null;
  album_date: string | null;
  cover_url: string | null;
  sort_order: number | null;
  is_published: boolean | null;
  album_media?: RawAdminMedia[];
};

type RawAdminMedia = {
  id: string;
  album_id: string;
  media_type: "image" | "video";
  url: string;
  storage_path: string | null;
  alt: string | null;
  sort_order: number | null;
  is_cover: boolean | null;
};

type RawAdminBookingRequest = {
  id: string;
  created_at: string;
  profile_slug: string;
  album_slug: string | null;
  date: string;
  time: string;
  duration: string;
  contact: string;
  message: string | null;
  visitor_ip: string | null;
  status: string | null;
};

const sortByOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

const bookingStatuses = new Set(["new", "reviewed", "archived"]);

function bookingStatus(value: string | null): BookingStatus {
  return bookingStatuses.has(value ?? "") ? (value as BookingStatus) : "new";
}

function mapSiteAssets(rows: RawAdminSiteAsset[] | null): SiteAsset[] {
  if (!rows) return seedAssets;

  return sortByOrder(
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
  );
}

function mapMedia(rows: RawAdminMedia[] | undefined): AlbumMedia[] {
  return sortByOrder(
    (rows ?? []).map((row) => ({
      id: row.id,
      albumId: row.album_id,
      mediaType: row.media_type,
      url: row.url,
      storagePath: row.storage_path ?? undefined,
      alt: row.alt ?? "",
      sortOrder: row.sort_order ?? 0,
      isCover: Boolean(row.is_cover),
    })),
  );
}

function mapAlbums(rows: RawAdminAlbum[] | undefined): Album[] {
  return sortByOrder(
    (rows ?? []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      slug: row.slug,
      title: row.title,
      note: row.note ?? undefined,
      albumDate: row.album_date ?? undefined,
      coverUrl: row.cover_url ?? undefined,
      sortOrder: row.sort_order ?? 0,
      isPublished: Boolean(row.is_published),
      media: mapMedia(row.album_media),
    })),
  );
}

function mapProfiles(rows: RawAdminProfile[] | null): Profile[] {
  if (!rows) return seedProfiles;

  return sortByOrder(
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
      enabled: Boolean(row.enabled),
      albums: mapAlbums(row.albums),
    })),
  );
}

function mapSchedule(rows: Record<string, unknown>[] | null): ScheduleItem[] {
  if (!rows) return seedSchedule;

  return sortByOrder(
    rows.map((row) => ({
      id: String(row.id),
      displayTime: String(row.display_time ?? ""),
      label: String(row.label ?? ""),
      sortOrder: Number(row.sort_order ?? 0),
      isVisible: Boolean(row.is_visible ?? true),
    })),
  );
}

function mapNotes(rows: Record<string, unknown>[] | null): Note[] {
  if (!rows) return seedNotes;

  return sortByOrder(
    rows.map((row) => ({
      id: String(row.id),
      text: String(row.text ?? ""),
      sortOrder: Number(row.sort_order ?? 0),
      isVisible: Boolean(row.is_visible ?? true),
    })),
  );
}

function mapBookingRequests(rows: RawAdminBookingRequest[] | null): BookingRequest[] {
  if (!rows) return seedBookingRequests;

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    profileSlug: row.profile_slug,
    albumSlug: row.album_slug ?? undefined,
    date: row.date,
    time: row.time,
    duration: row.duration,
    contact: row.contact,
    message: row.message ?? undefined,
    visitorIp: row.visitor_ip ?? undefined,
    status: bookingStatus(row.status),
  }));
}

export async function getAdminContent(): Promise<SiteContent> {
  const supabase = getAdminSupabase();

  if (!supabase) {
    return {
      settings: seedSettings,
      assets: seedAssets,
      schedule: seedSchedule,
      notes: seedNotes,
      profiles: seedProfiles,
      albums: seedAlbums,
      bookingRequests: seedBookingRequests,
    };
  }

  const [settingsResult, assetsResult, scheduleResult, notesResult, profilesResult, bookingRequestsResult] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("site_assets").select("*").order("sort_order", { ascending: true }),
    supabase.from("tonight_schedule").select("*").order("sort_order", { ascending: true }),
    supabase.from("notes").select("*").order("sort_order", { ascending: true }),
    supabase.from("profiles").select("*, albums(*, album_media(*))").order("sort_order", { ascending: true }),
    supabase.from("booking_requests").select("*").order("created_at", { ascending: false }),
  ]);

  const profiles = profilesResult.error ? seedProfiles : mapProfiles(profilesResult.data as RawAdminProfile[] | null);

  return {
    settings: settingsResult.data
      ? {
          heroNote: String(settingsResult.data.hero_note ?? seedSettings.heroNote),
          momentsNote: String(settingsResult.data.moments_note ?? seedSettings.momentsNote),
          footerLine: String(settingsResult.data.footer_line ?? seedSettings.footerLine),
        }
      : seedSettings,
    assets: assetsResult.error ? seedAssets : mapSiteAssets(assetsResult.data as RawAdminSiteAsset[] | null),
    schedule: mapSchedule(scheduleResult.data),
    notes: mapNotes(notesResult.data),
    profiles,
    albums: profiles.flatMap((profile) => profile.albums),
    bookingRequests: bookingRequestsResult.error
      ? seedBookingRequests
      : mapBookingRequests(bookingRequestsResult.data as RawAdminBookingRequest[] | null),
  };
}
