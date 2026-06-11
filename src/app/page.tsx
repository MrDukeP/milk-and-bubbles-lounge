export const runtime = "edge";

import Link from "next/link";

import { NeonPolaroid, PublicAgeGate } from "@/components/public-age-gate";
import { SiteAssetMedia } from "@/components/site-asset-media";
import { isAgeVerified } from "@/lib/age-gate";
import { getSiteContent } from "@/lib/data";
import { firstSiteAssetOfType } from "@/lib/site-assets";

export default async function Home() {
  const verified = await isAgeVerified();

  if (!verified) {
    return <PublicAgeGate />;
  }

  const content = await getSiteContent();
  const heroPolaroid =
    firstSiteAssetOfType(content.assets, "hero_polaroid") ?? firstSiteAssetOfType(content.assets, "hero_image");
  const background = firstSiteAssetOfType(content.assets, "background_texture");
  const overlay = firstSiteAssetOfType(content.assets, "overlay") ?? firstSiteAssetOfType(content.assets, "grain_layer");

  return (
    <PublicAgeGate initialVerified>
      <main className="site-shell home-stage final-home">
        <section className="landing-hero" aria-label="Milk and Bubbles">
          <SiteAssetMedia asset={background} className="site-asset site-asset--background" decorative eager />
          <SiteAssetMedia asset={overlay} className="site-asset site-asset--overlay" decorative eager />
          <div className="ambient-grain" />

          <div className="landing-hero__center">
            {heroPolaroid ? (
              <SiteAssetMedia asset={heroPolaroid} className="landing-hero__asset-polaroid" decorative eager />
            ) : (
              <NeonPolaroid className="landing-hero__polaroid" />
            )}
            <h1 className="visually-hidden">Milk &amp; Bubbles</h1>
            <Link className="landing-enter" href="/moments">
              Enter <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    </PublicAgeGate>
  );
}
