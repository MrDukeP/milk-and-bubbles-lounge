/* eslint-disable @next/next/no-img-element */

import type { AlbumMedia } from "@/lib/types";

type PrintMedia = {
  mediaType: "image" | "video";
  url?: string;
  alt: string;
  placeholderTone?: string;
};

type MemoryPrintProps = {
  media?: AlbumMedia | PrintMedia;
  tone?: string;
  className?: string;
  rotate?: string;
  lift?: string;
};

export function MemoryPrint({ media, tone = "rose", className = "", rotate = "0deg", lift = "0px" }: MemoryPrintProps) {
  const toneName = media?.placeholderTone ?? tone;

  return (
    <span
      className={`memory-print memory-print--${toneName} ${className}`}
      style={{ transform: `translateY(${lift}) rotate(${rotate})` }}
    >
      <span className="memory-print__image" aria-hidden={!media?.url}>
        {media?.url && media.mediaType === "video" ? (
          <video src={media.url} muted playsInline preload="metadata" />
        ) : media?.url ? (
          <img src={media.url} alt={media.alt} loading="lazy" />
        ) : (
          <span className="memory-print__placeholder" />
        )}
      </span>
    </span>
  );
}
