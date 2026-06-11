"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSiteContent } from "@/lib/data";
import { getAdminSupabase } from "@/lib/supabase";

const durationOptions = new Set(["1 hour", "2 hours", "3 hours", "Overnight"]);

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectBack(profileSlug: string, albumSlug: string, state: "submitted" | "invalid"): never {
  const params = new URLSearchParams();
  if (profileSlug) params.set("profile", profileSlug);
  if (albumSlug) params.set("album", albumSlug);
  params.set(state, "1");
  redirect(`/booking?${params.toString()}`);
}

export async function createBookingRequestAction(formData: FormData) {
  const content = await getSiteContent();
  const profileSlug = stringValue(formData, "profile");
  const albumSlug = stringValue(formData, "album");
  const profile = content.profiles.find((item) => item.slug === profileSlug);
  const album = albumSlug ? profile?.albums.find((item) => item.slug === albumSlug) : undefined;
  const date = stringValue(formData, "date");
  const time = stringValue(formData, "time");
  const duration = stringValue(formData, "duration");
  const contact = stringValue(formData, "contact");
  const message = stringValue(formData, "message");

  if (!profile || (albumSlug && !album) || !date || !time || !durationOptions.has(duration) || !contact) {
    redirectBack(profileSlug, albumSlug, "invalid");
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const visitorIp = forwardedFor || requestHeaders.get("x-real-ip") || null;
  const supabase = getAdminSupabase();

  if (supabase) {
    await supabase.from("booking_requests").insert({
      profile_slug: profile.slug,
      album_slug: album?.slug ?? null,
      date,
      time,
      duration,
      contact,
      message: message || null,
      visitor_ip: visitorIp,
      status: "new",
    });
  }

  revalidatePath("/admin");
  redirectBack(profile.slug, album?.slug ?? "", "submitted");
}
