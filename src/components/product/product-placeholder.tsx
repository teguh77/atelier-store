import type { CSSProperties } from "react";

import type { CategorySlug } from "@/lib/products";

/*
 * Stand-in for product photography: the 3:4 canvas frame used everywhere
 * for product images, with a hairline drawing of the product type.
 * Each "view" frames the drawing differently so a gallery doesn't repeat.
 */

const drawings: Record<CategorySlug, React.ReactNode> = {
  bags: (
    <>
      <path d="M22 40h56l-5 40H27l-5-40Z" />
      <path d="M38 40v-6a12 12 0 0 1 24 0v6" />
      <path d="M22 50h56" />
    </>
  ),
  shoes: (
    <>
      <path d="M10 66c0-7 5-11 12-11 10 0 17-3 23-10 5 5 12 7 21 8 13 1 24 5 24 11v4H10v-2Z" />
      <path d="M10 68h80" />
      <path d="M45 45c5 6 12 8 21 8" />
      <path d="M58 53l-2 6M66 53l-1 6" />
    </>
  ),
  "ready-to-wear": (
    <>
      <path d="M50 22a5 5 0 1 1 5 5l-5 4" />
      <path d="M50 31 18 46h64L50 31Z" />
      <path d="M30 46v34h40V46" />
      <path d="M44 46l6 10 6-10" />
    </>
  ),
  "jewelry-watches": (
    <>
      <circle cx="50" cy="56" r="16" />
      <circle cx="50" cy="56" r="12" />
      <path d="M42 41l-2-21h20l-2 21M42 71l-2 9h20l-2-9" />
      <path d="M50 56V48M50 56h6" />
    </>
  ),
  accessories: (
    <>
      <circle cx="33" cy="54" r="12" />
      <circle cx="67" cy="54" r="12" />
      <path d="M45 52c3-3 7-3 10 0" />
      <path d="M21 52 14 46M79 52l7-6" />
    </>
  ),
};

const viewTransforms: CSSProperties[] = [
  {},
  { transform: "scaleX(0.82)" },
  { transform: "scaleX(-1)" },
  { transform: "scale(2.1) translate(4%, 6%)" },
];

type ProductPlaceholderProps = {
  category: CategorySlug;
  /** 0 front, 1 side, 2 back, 3 detail. */
  view?: number;
  label?: string;
  className?: string;
};

export function ProductPlaceholder({
  category,
  view = 0,
  label,
  className,
}: ProductPlaceholderProps) {
  return (
    <div className={`media-product ${className ?? ""}`} role="img" aria-label={label ? `${label} (image coming soon)` : "Image coming soon"}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-auto w-1/2 text-muted [&_*]:[vector-effect:non-scaling-stroke]"
        style={viewTransforms[view % viewTransforms.length]}
      >
        {drawings[category]}
      </svg>
      {label && (
        <span className="type-caption absolute bottom-4 left-4 text-muted">{label}</span>
      )}
    </div>
  );
}
