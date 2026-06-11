import type { SiteAssetType } from "./site-assets";

export type ScheduleItem = {
  id: string;
  displayTime: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
};

export type Note = {
  id: string;
  text: string;
  sortOrder: number;
  isVisible: boolean;
};

export type SiteSettings = {
  heroNote: string;
  momentsNote: string;
  footerLine: string;
};

export type SiteAsset = {
  id: string;
  assetType: SiteAssetType;
  mediaType: "image" | "video";
  url?: string;
  storagePath?: string;
  altText: string;
  sortOrder: number;
  enabled: boolean;
  mobileVisibility: boolean;
  desktopVisibility: boolean;
};

export type AlbumMedia = {
  id: string;
  albumId: string;
  mediaType: "image" | "video";
  url?: string;
  storagePath?: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
  placeholderTone?: string;
};

export type Album = {
  id: string;
  profileId: string;
  slug: string;
  title: string;
  note?: string;
  albumDate?: string;
  coverUrl?: string;
  sortOrder: number;
  isPublished: boolean;
  coverTone?: string;
  media: AlbumMedia[];
};

export type Profile = {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
  coverStoragePath?: string;
  intro?: string;
  description?: string;
  status: string;
  schedule: string;
  sortOrder: number;
  enabled: boolean;
  coverTone?: string;
  albums: Album[];
};

export type BookingStatus = "new" | "reviewed" | "archived";

export type BookingRequest = {
  id: string;
  createdAt: string;
  profileSlug: string;
  albumSlug?: string;
  date: string;
  time: string;
  duration: string;
  contact: string;
  message?: string;
  visitorIp?: string;
  status: BookingStatus;
};

export type SiteContent = {
  settings: SiteSettings;
  assets: SiteAsset[];
  schedule: ScheduleItem[];
  notes: Note[];
  profiles: Profile[];
  albums: Album[];
  bookingRequests: BookingRequest[];
};
