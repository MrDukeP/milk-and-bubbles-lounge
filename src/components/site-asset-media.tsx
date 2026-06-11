/* eslint-disable @next/next/no-img-element */

import type { SiteAsset } from "@/lib/types";

type SiteAssetMediaProps = {
  asset?: SiteAsset;
  className?: string;
  decorative?: boolean;
  eager?: boolean;
};

export function SiteAssetMedia({ asset, className = "", decorative = false, eager = false }: SiteAssetMediaProps) {
  if (!asset?.url) return null;

  const visibilityClass = [
    className,
    !asset.mobileVisibility ? "site-asset--mobile-hidden" : "",
    !asset.desktopVisibility ? "site-asset--desktop-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (asset.mediaType === "video") {
    return (
      <video
        aria-hidden={decorative}
        className={visibilityClass}
        muted
        loop
        playsInline
        autoPlay
        preload={eager ? "auto" : "metadata"}
        src={asset.url}
      />
    );
  }

  return (
    <img
      alt={decorative ? "" : asset.altText}
      aria-hidden={decorative}
      className={visibilityClass}
      loading={eager ? "eager" : "lazy"}
      src={asset.url}
    />
  );
}
