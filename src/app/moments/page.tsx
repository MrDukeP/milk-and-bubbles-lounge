import Link from "next/link";

import { MemoryPrint } from "@/components/memory-print";
import { PublicAgeGate } from "@/components/public-age-gate";
import { SiteAssetMedia } from "@/components/site-asset-media";
import { isAgeVerified } from "@/lib/age-gate";
import { getSiteContent } from "@/lib/data";
import { firstSiteAssetOfType } from "@/lib/site-assets";

const placement = [
  { className: "album-object album-object--large album-object--one", rotate: "-6deg", lift: "0px" },
  { className: "album-object album-object--two", rotate: "5deg", lift: "22px" },
  { className: "album-object album-object--three", rotate: "-3deg", lift: "-8px" },
  { className: "album-object album-object--wide album-object--four", rotate: "4deg", lift: "18px" },
  { className: "album-object album-object--five", rotate: "-8deg", lift: "4px" },
];

export default async function Moments() {
  const verified = await isAgeVerified();

  if (!verified) {
    return <PublicAgeGate />;
  }

  const content = await getSiteContent();
  const background = firstSiteAssetOfType(content.assets, "background_texture");
  const overlay = firstSiteAssetOfType(content.assets, "overlay") ?? firstSiteAssetOfType(content.assets, "grain_layer");

  return (
    <PublicAgeGate initialVerified>
      <main className="site-shell moments-stage">
        <SiteAssetMedia asset={background} className="site-asset site-asset--background" decorative eager />
        <SiteAssetMedia asset={overlay} className="site-asset site-asset--overlay" decorative eager />
        <div className="ambient-grain" />

        <header className="moments-header">
          <Link className="return-mark" href="/" aria-label="Milk and Bubbles home">
            ←
          </Link>
          <h1>Moments</h1>
        </header>

        <section className="album-scatter" aria-label="Moments">
          {content.profiles.map((profile, index) => {
            const place = placement[index % placement.length];
            return (
              <Link className={place.className} href={`/moments/${profile.slug}`} key={profile.id}>
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
                  rotate={place.rotate}
                  lift={place.lift}
                />
                <span className="album-object__label">
                  <span>{profile.name}</span>
                  <span>{profile.status}</span>
                </span>
              </Link>
            );
          })}
        </section>
      </main>
    </PublicAgeGate>
  );
}
