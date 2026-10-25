"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/cn";
import type { CategorySlug } from "@/lib/products";

import { ProductPlaceholder } from "./product-placeholder";

const VIEWS = ["Front", "Side", "Back", "Detail"];

/**
 * Phone/tablet: swipeable row, one view per screen, with counter and dots.
 * Desktop: all four views in a 2 × 2 grid.
 */
export function ProductGallery({ name, category }: { name: string; category: CategorySlug }) {
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
    <div className="relative" aria-roledescription="carousel" aria-label={`${name} views`}>
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {VIEWS.map((view, i) => (
          <li
            key={view}
            className="w-full shrink-0 snap-start lg:w-auto"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${VIEWS.length}`}
          >
            <ProductPlaceholder category={category} view={i} label={view} />
          </li>
        ))}
      </ul>

      {/* Position indicator, phones and tablets only. */}
      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 lg:hidden">
        {VIEWS.map((view, i) => (
          <button
            key={view}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${view.toLowerCase()} view`}
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
      <span className="type-caption absolute right-4 top-4 text-muted lg:hidden" aria-hidden="true">
        {index + 1} / {VIEWS.length}
      </span>
    </div>
  );
}
