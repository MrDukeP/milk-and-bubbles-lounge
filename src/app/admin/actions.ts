"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  slugify,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { isSiteAssetType } from "@/lib/site-assets";
import { getAdminSupabase, STORAGE_BUCKET } from "@/lib/supabase";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function refreshSite() {
  revalidatePath("/");
  revalidatePath("/moments");
  revalidatePath("/moments/[slug]", "page");
  revalidatePath("/moments/[slug]/[albumSlug]", "page");
  revalidatePath("/booking");
  revalidatePath("/admin");
}

export async function loginAction(formData: FormData) {
  const password = stringValue(formData, "password");

  if (verifyAdminPassword(password)) {
    await createAdminSession();
  }

  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  await supabase.from("site_settings").upsert({
    id: true,
    hero_note: stringValue(formData, "heroNote"),
    moments_note: stringValue(formData, "momentsNote"),
    footer_line: stringValue(formData, "footerLine"),
    updated_at: new Date().toISOString(),
  });

  refreshSite();
  redirect("/admin");
}

export async function updateScheduleAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const rows = parseLines(stringValue(formData, "schedule")).map((line, index) => {
    const [displayTime, ...labelParts] = line.split("|").map((part) => part.trim());
    return {
      display_time: displayTime,
      label: labelParts.join(" | "),
      sort_order: index + 1,
      is_visible: true,
    };
  }).filter((row) => row.display_time && row.label);

  await supabase.from("tonight_schedule").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (rows.length) await supabase.from("tonight_schedule").insert(rows);

  refreshSite();
  redirect("/admin");
}

export async function updateNotesAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const rows = parseLines(stringValue(formData, "notes")).map((text, index) => ({
    text,
    sort_order: index + 1,
    is_visible: true,
  }));

  await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (rows.length) await supabase.from("notes").insert(rows);

  refreshSite();
  redirect("/admin");
}

export async function createProfileAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const name = stringValue(formData, "name");
  if (!name) redirect("/admin");

  await supabase.from("profiles").insert({
    name,
    slug: slugify(stringValue(formData, "slug") || name),
    intro: stringValue(formData, "intro") || null,
    description: stringValue(formData, "description") || null,
    status: stringValue(formData, "status") || "Available",
    schedule: stringValue(formData, "schedule"),
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    enabled: formData.get("enabled") === "on",
  });

  refreshSite();
  redirect("/admin");
}

export async function updateProfileAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const name = stringValue(formData, "name");
  if (!id || !name) redirect("/admin");

  const file = formData.get("file");
  const oldCoverStoragePath = stringValue(formData, "coverStoragePath");
  const updatePayload: Record<string, boolean | number | string | null> = {
    name,
    slug: slugify(stringValue(formData, "slug") || name),
    intro: stringValue(formData, "intro") || null,
    description: stringValue(formData, "description") || null,
    status: stringValue(formData, "status") || "Available",
    schedule: stringValue(formData, "schedule"),
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    enabled: formData.get("enabled") === "on",
    updated_at: new Date().toISOString(),
  };

  if (file instanceof File && file.size) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `profiles/${id}/cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (upload.error) redirect("/admin");

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    updatePayload.cover_image = data.publicUrl;
    updatePayload.cover_storage_path = path;
  }

  await supabase.from("profiles").update(updatePayload).eq("id", id);

  if (oldCoverStoragePath && typeof updatePayload.cover_storage_path === "string") {
    await supabase.storage.from(STORAGE_BUCKET).remove([oldCoverStoragePath]);
  }

  refreshSite();
  redirect("/admin");
}

export async function deleteProfileAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const coverStoragePath = stringValue(formData, "coverStoragePath");

  if (coverStoragePath) await supabase.storage.from(STORAGE_BUCKET).remove([coverStoragePath]);
  if (id) await supabase.from("profiles").delete().eq("id", id);

  refreshSite();
  redirect("/admin");
}

export async function createAlbumAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const profileId = stringValue(formData, "profileId");
  const title = stringValue(formData, "title");
  if (!profileId || !title) redirect("/admin");

  await supabase.from("albums").insert({
    profile_id: profileId,
    title,
    slug: slugify(stringValue(formData, "slug") || title),
    note: stringValue(formData, "note") || null,
    album_date: stringValue(formData, "albumDate") || null,
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    is_published: formData.get("isPublished") === "on",
  });

  refreshSite();
  redirect("/admin");
}

export async function updateAlbumAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const profileId = stringValue(formData, "profileId");
  const title = stringValue(formData, "title");
  if (!id || !profileId || !title) redirect("/admin");

  await supabase
    .from("albums")
    .update({
      profile_id: profileId,
      title,
      slug: slugify(stringValue(formData, "slug") || title),
      note: stringValue(formData, "note") || null,
      album_date: stringValue(formData, "albumDate") || null,
      sort_order: Number(stringValue(formData, "sortOrder") || 100),
      is_published: formData.get("isPublished") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  refreshSite();
  redirect("/admin");
}

export async function deleteAlbumAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  if (id) await supabase.from("albums").delete().eq("id", id);

  refreshSite();
  redirect("/admin");
}

export async function uploadSiteAssetAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const assetType = stringValue(formData, "assetType");
  const file = formData.get("file");
  if (!isSiteAssetType(assetType) || !(file instanceof File) || !file.size) redirect("/admin");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `site-assets/${assetType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (upload.error) redirect("/admin");

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  await supabase.from("site_assets").insert({
    asset_type: assetType,
    media_type: mediaType,
    url: data.publicUrl,
    storage_path: path,
    alt_text: stringValue(formData, "altText"),
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    enabled: formData.get("enabled") === "on",
    mobile_visibility: formData.get("mobileVisibility") === "on",
    desktop_visibility: formData.get("desktopVisibility") === "on",
  });

  refreshSite();
  redirect("/admin");
}

export async function updateSiteAssetAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const assetType = stringValue(formData, "assetType");
  if (!id || !isSiteAssetType(assetType)) redirect("/admin");

  const file = formData.get("file");
  const oldStoragePath = stringValue(formData, "storagePath");
  const updatePayload: Record<string, boolean | number | string | null> = {
    asset_type: assetType,
    alt_text: stringValue(formData, "altText"),
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    enabled: formData.get("enabled") === "on",
    mobile_visibility: formData.get("mobileVisibility") === "on",
    desktop_visibility: formData.get("desktopVisibility") === "on",
    updated_at: new Date().toISOString(),
  };

  if (file instanceof File && file.size) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `site-assets/${assetType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (upload.error) redirect("/admin");

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    updatePayload.media_type = mediaType;
    updatePayload.url = data.publicUrl;
    updatePayload.storage_path = path;
  }

  await supabase
    .from("site_assets")
    .update(updatePayload)
    .eq("id", id);

  if (oldStoragePath && typeof updatePayload.storage_path === "string" && updatePayload.storage_path !== oldStoragePath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([oldStoragePath]);
  }

  refreshSite();
  redirect("/admin");
}

export async function deleteSiteAssetAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const storagePath = stringValue(formData, "storagePath");

  if (storagePath) await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (id) await supabase.from("site_assets").delete().eq("id", id);

  refreshSite();
  redirect("/admin");
}

export async function uploadMediaAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const albumId = stringValue(formData, "albumId");
  const file = formData.get("file");
  if (!albumId || !(file instanceof File) || !file.size) redirect("/admin");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  const upload = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (upload.error) redirect("/admin");

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  await supabase.from("album_media").insert({
    album_id: albumId,
    media_type: mediaType,
    url: data.publicUrl,
    storage_path: path,
    alt: stringValue(formData, "alt"),
    sort_order: Number(stringValue(formData, "sortOrder") || 100),
    is_cover: formData.get("isCover") === "on",
  });

  if (formData.get("isCover") === "on") {
    await supabase.from("albums").update({ cover_url: data.publicUrl }).eq("id", albumId);
  }

  refreshSite();
  redirect("/admin");
}

export async function updateMediaAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const albumId = stringValue(formData, "albumId");
  if (!id || !albumId) redirect("/admin");

  const isCover = formData.get("isCover") === "on";

  if (isCover) {
    await supabase.from("album_media").update({ is_cover: false }).eq("album_id", albumId);
  }

  await supabase
    .from("album_media")
    .update({
      alt: stringValue(formData, "alt"),
      sort_order: Number(stringValue(formData, "sortOrder") || 100),
      is_cover: isCover,
    })
    .eq("id", id);

  if (isCover) {
    const { data } = await supabase.from("album_media").select("url").eq("id", id).single();
    if (data?.url) await supabase.from("albums").update({ cover_url: data.url }).eq("id", albumId);
  }

  refreshSite();
  redirect("/admin");
}

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const storagePath = stringValue(formData, "storagePath");

  if (storagePath) await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (id) await supabase.from("album_media").delete().eq("id", id);

  refreshSite();
  redirect("/admin");
}

export async function updateBookingRequestStatusAction(formData: FormData) {
  await requireAdmin();
  const supabase = getAdminSupabase();
  if (!supabase) redirect("/admin");

  const id = stringValue(formData, "id");
  const status = stringValue(formData, "status");

  if (!id || !["new", "reviewed", "archived"].includes(status)) {
    redirect("/admin");
  }

  await supabase.from("booking_requests").update({ status }).eq("id", id);

  refreshSite();
  redirect("/admin");
}
