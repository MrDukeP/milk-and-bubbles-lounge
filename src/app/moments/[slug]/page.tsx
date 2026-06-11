export const runtime = "edge";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemoryPrint } from "@/components/memory-print";
import { PublicAgeGate } from "@/components/public-age-gate";
import { SiteAssetMedia } from "@/components/site-asset-media";
import { isAgeVerified } from "@/lib/age-gate";
import { getProfileBySlug, getSiteContent } from "@/lib/data";
import { firstSiteAssetOfType } from "@/lib/site-assets";

type ProfilePageProps = PageProps<"/moments/[slug]">;

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const verified = await isAgeVerified();
  if (!verified) {
    return {
      title: "Milk & Bubbles Lounge",
      description: "Milk & Bubbles Lounge",
    };
  }

  const { slug } = await params;
  const profile = await getProfileBySlug(slug);

  return {
    title: profile ? `${profile.name} | Milk & Bubbles` : "Milk & Bubbles",
    description: "Milk & Bubbles",
  };
}


export default async function ProfilePage({ params }: ProfilePageProps) {
  const verified = await isAgeVerified();

  if (!verified) {
    return <PublicAgeGate />;
  }

  const { slug } = await params;
  const profile = await getProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const content = await getSiteContent();
  const background = firstSiteAssetOfType(content.assets, "background_texture");
  const overlay = firstSiteAssetOfType(content.assets, "overlay") ?? firstSiteAssetOfType(content.assets, "grain_layer");

  return (
    <PublicAgeGate initialVerified>
      <main className="site-shell profile-stage">
        <SiteAssetMedia asset={background} className="site-asset site-asset--background" decorative eager />
        <SiteAssetMedia asset={overlay} className="site-asset site-asset--overlay" decorative eager />
        <div className="ambient-grain" />

        <header className="profile-cover">
          <Link href="/moments" aria-label="Moments">
            Moments
          </Link>
          <div className="profile-cover__print">
            <MemoryPrint
              media={
                profile.coverImage
                  ? {
                      mediaType: "image",
                      url: profile.coverImage,
                      alt: profile.name,
                    }
                  : undefined
              }
              tone={profile.coverTone}
              rotate="-2deg"
            />
          </div>
          <div className="profile-cover__copy">
            <h1>{profile.name}</h1>
            <span className="profile-status">{profile.status}</span>
            {profile.schedule ? (
              <div className="profile-schedule">
                {profile.schedule.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : null}
            {profile.intro ? <p>{profile.intro}</p> : null}
            {profile.description ? <p>{profile.description}</p> : null}
            <Link className="soft-action" href={`/booking?profile=${profile.slug}`}>
              Request Booking
            </Link>
          </div>
        </header>

        {profile.albums.length ? (
          <section className="profile-albums" aria-label={`${profile.name} albums`}>
            {profile.albums.map((album, index) => (
              <Link className="profile-album-link" href={`/moments/${profile.slug}/${album.slug}`} key={album.id}>
                <MemoryPrint
                  media={album.media.find((item) => item.isCover) ?? album.media[0]}
                  tone={album.coverTone}
                  rotate={index % 2 === 0 ? "-4deg" : "3deg"}
                  lift={index % 3 === 0 ? "14px" : "0px"}
                />
                <span>{album.title}</span>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </PublicAgeGate>
  );
}
