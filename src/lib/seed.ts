import type { Album, AlbumMedia, BookingRequest, Note, Profile, ScheduleItem, SiteAsset, SiteContent, SiteSettings } from "./types";

export const seedSettings: SiteSettings = {
  heroNote: "",
  momentsNote: "",
  footerLine: "",
};

export const seedAssets: SiteAsset[] = [];

export const seedSchedule: ScheduleItem[] = [
  {
    id: "seed-schedule-1",
    displayTime: "9 PM",
    label: "Doors Open",
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: "seed-schedule-2",
    displayTime: "11 PM",
    label: "Pink Hour",
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: "seed-schedule-3",
    displayTime: "1 AM",
    label: "Last Call",
    sortOrder: 3,
    isVisible: true,
  },
];

export const seedNotes: Note[] = [];

const tones = ["rose", "cream", "pearl", "cherry", "milk"] as const;

function placeholderMedia(albumId: string, count: number): AlbumMedia[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${albumId}-media-${index + 1}`,
    albumId,
    mediaType: "image",
    alt: "",
    sortOrder: index + 1,
    isCover: index === 0,
    placeholderTone: tones[index % tones.length],
  }));
}

function photoMedia(albumId: string, urls: string[]): AlbumMedia[] {
  return urls.map((url, index) => ({
    id: `${albumId}-media-${index + 1}`,
    albumId,
    mediaType: "image",
    url,
    alt: "",
    sortOrder: index + 1,
    isCover: index === 0,
  }));
}

export const seedAlbums: Album[] = [
  {
    id: "album-pink-hour",
    profileId: "profile-luna",
    slug: "pink-hour",
    title: "Pink Hour",
    note: "",
    sortOrder: 1,
    isPublished: true,
    coverTone: "rose",
    media: photoMedia("album-pink-hour", [
      "/assets/milk-bubbles/luna-pink-hour-01.jpg",
      "/assets/milk-bubbles/luna-cover.jpg",
      "/assets/milk-bubbles/luna-polaroid.jpg",
      "/assets/milk-bubbles/luna-polaroid-portrait.jpg",
    ]),
  },
  {
    id: "album-room-888",
    profileId: "profile-luna",
    slug: "room-888",
    title: "Room 888",
    sortOrder: 2,
    isPublished: true,
    coverTone: "cherry",
    media: photoMedia("album-room-888", [
      "/assets/milk-bubbles/room-888-wide.jpg",
      "/assets/milk-bubbles/luna-cover.jpg",
      "/assets/milk-bubbles/luna-polaroid-alt.jpg",
    ]),
  },
  {
    id: "album-champagne-night",
    profileId: "profile-luna",
    slug: "champagne-night",
    title: "Champagne Night",
    sortOrder: 3,
    isPublished: true,
    coverTone: "pearl",
    media: photoMedia("album-champagne-night", [
      "/assets/milk-bubbles/luna-cover.jpg",
      "/assets/milk-bubbles/room-888-wide.jpg",
      "/assets/milk-bubbles/luna-polaroid-portrait.jpg",
    ]),
  },
  {
    id: "album-summer-2026",
    profileId: "profile-vivian",
    slug: "summer-2026",
    title: "Summer 2026",
    sortOrder: 4,
    isPublished: true,
    coverTone: "milk",
    media: placeholderMedia("album-summer-2026", 1),
  },
];

export const seedProfiles: Profile[] = [
  {
    id: "profile-luna",
    name: "Luna",
    slug: "luna",
    coverImage: "/assets/milk-bubbles/luna-polaroid-portrait.jpg",
    intro: "Private evenings. Warm light. Quiet rooms.",
    description: "",
    status: "On Duty",
    schedule: "Today\n8 PM - 2 AM",
    sortOrder: 1,
    enabled: true,
    coverTone: "rose",
    albums: seedAlbums.filter((album) => album.profileId === "profile-luna"),
  },
  {
    id: "profile-vivian",
    name: "Vivian",
    slug: "vivian",
    intro: "",
    description: "",
    status: "On Duty",
    schedule: "Friday\n8 PM - 3 AM",
    sortOrder: 2,
    enabled: false,
    coverTone: "cherry",
    albums: seedAlbums.filter((album) => album.profileId === "profile-vivian"),
  },
  {
    id: "profile-mia",
    name: "Mia",
    slug: "mia",
    intro: "",
    description: "",
    status: "Away",
    schedule: "Saturday\n10 PM - Late",
    sortOrder: 3,
    enabled: false,
    coverTone: "pearl",
    albums: [],
  },
];

export const seedBookingRequests: BookingRequest[] = [];

const publicSeedProfiles = seedProfiles.filter((profile) => profile.enabled);
const publicSeedAlbums = publicSeedProfiles.flatMap((profile) => profile.albums);

export const seedContent: SiteContent = {
  settings: seedSettings,
  assets: seedAssets,
  schedule: seedSchedule,
  notes: seedNotes,
  profiles: publicSeedProfiles,
  albums: publicSeedAlbums,
  bookingRequests: seedBookingRequests,
};
