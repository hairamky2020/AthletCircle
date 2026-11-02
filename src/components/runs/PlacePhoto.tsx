"use client";

import { useState } from "react";
import type { Photo } from "@/lib/images";

/** A free-licence photo of the place, with credit. Hides itself if the image can't load. */
export function PlacePhoto({ photo, className = "" }: { photo: Photo; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <figure className={`place-photo ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt={photo.caption} onError={() => setOk(false)} />
      <figcaption>
        {photo.generic ? `${photo.caption} (city photo, not the venue)` : photo.caption} ·{" "}
        <a href={photo.page} target="_blank" rel="noopener">Wikimedia Commons</a>
      </figcaption>
    </figure>
  );
}
