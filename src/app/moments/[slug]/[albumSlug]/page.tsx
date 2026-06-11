import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemoryPrint } from "@/components/memory-print";
import { PublicAgeGate } from "@/components/public-age-gate";
import { SiteAssetMedia } from "@/components/site-asset-media";
import { isAgeVerified } from "@/lib/age-gate";
import { getAlbumBySlug, getSiteContent } from "@/lib/data";
import { firstSiteAssetOfType } from "@/lib/site-assets";

type AlbumPageProps = PageProps<"/moments/[slug]/[albumSlug]">;

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const verified = await isAgeVerified();
  if (!verified) {
    return {
      title: "Milk & Bubbles Lounge",
      description: "Milk & Bubbles Lounge",
    };
  }

  const { slug, albumSlug } = await params;
  const result = await getAlbumBySlug(slug, albumSlug);

  return {
    title: result ? `${result.album.title} | ${result.profile.name}` : "Milk & Bubbles",
    description: "Milk & Bubbles",
  };
}

export async function generateStaticParams() {
  const content = await getSiteContent();
  return content.profiles.flatMap((profile) =>
    profile.albums.map((album) => ({
      slug: profile.slug,
      albumSlug: album.slug,
    })),
  );
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const verified = await isAgeVerified();

  if (!verified) {
    return <PublicAgeGate />;
  }

  const { slug, albumSlug } = await params;
  const result = await getAlbumBySlug(slug, albumSlug);

  if (!result) {
    notFound();
  }

  const { profile, album } = result;
  const media = album.media;
  const content = await getSiteContent();
  const background = firstSiteAssetOfType(content.assets, "background_texture");
  const overlay = firstSiteAssetOfType(content.assets, "overlay") ?? firstSiteAssetOfType(content.assets, "grain_layer");

  return (
    <PublicAgeGate initialVerified>
      <main className="site-shell album-stage">
        <SiteAssetMedia asset={background} className="site-asset site-asset--background" decorative eager />
        <SiteAssetMedia asset={overlay} className="site-asset site-asset--overlay" decorative eager />
        <div className="ambient-grain" />

        <header className="album-cover">
          <Link href={`/moments/${profile.slug}`} aria-label={profile.name}>
            Back to Profile
          </Link>
          <div className="album-cover__copy">
            <h1>{album.title}</h1>
            {album.albumDate ? <time dateTime={album.albumDate}>{album.albumDate}</time> : null}
            {album.note ? <p>{album.note}</p> : null}
            <Link className="soft-action" href={`/booking?profile=${profile.slug}&album=${album.slug}`}>
              Request Booking
            </Link>
          </div>
        </header>

        <section className="scrapbook" aria-label={album.title}>
          {media.map((item, index) => (
            <MemoryPrint
              className={`scrapbook__print scrapbook__print--${(index % 6) + 1}`}
              key={item.id}
              media={item}
              rotate={index % 2 === 0 ? "-5deg" : "4deg"}
              lift={index % 3 === 0 ? "18px" : "0px"}
            />
          ))}
          {media.length === 0 ? (
            <>
              <MemoryPrint className="scrapbook__print scrapbook__print--1" tone="rose" rotate="-5deg" />
              <MemoryPrint className="scrapbook__print scrapbook__print--2" tone="cream" rotate="4deg" lift="18px" />
              <MemoryPrint className="scrapbook__print scrapbook__print--3" tone="pearl" rotate="-2deg" />
            </>
          ) : null}
        </section>
      </main>
    </PublicAgeGate>
  );
}
