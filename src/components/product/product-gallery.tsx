"use client";

import { useRef, useState } from "react";

import { UnsplashImage } from "@/components/ui/unsplash-image";
import { cn } from "@/lib/cn";
import type { Photo } from "@/lib/catalog";

/**
 * Phone/tablet: swipeable row, one photo per screen, with counter and dots.
 * Desktop: photos in a 2-column grid.
 */
export function ProductGallery({ name, images }: { name: string; images: Photo[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(i: number) {
    const track = trackRef.current;
    track?.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative" aria-roledescription="carousel" aria-label={`${name} photos`}>
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((photo, i) => (
          <li
            key={photo.src}
            className="w-full shrink-0 snap-start lg:w-auto"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
          >
            <div className="media-cover">
              <UnsplashImage
                src={photo.src}
                alt={photo.alt}
                fill
                preload={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                style={{ objectPosition: photo.position }}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Position indicator, phones and tablets only. */}
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 lg:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className="flex size-6 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-px transition-all duration-300",
                    i === index ? "w-5 bg-foreground" : "w-2.5 bg-muted",
                  )}
                />
              </button>
            ))}
          </div>
          <span
            className="type-caption absolute right-4 top-4 text-muted lg:hidden"
            aria-hidden="true"
          >
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}
