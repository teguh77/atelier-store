"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

/*
 * next/image for Unsplash photos.
 *
 * Unsplash serves its photos through its own resizing CDN. Asking it for the
 * exact width we need returns a ~100 KB file in about a second. Sending the
 * bare URL through Next's optimizer instead makes the server download the
 * full original (often 3–5 MB) for every size it generates, which times out.
 *
 * This loader keeps next/image's srcset, sizes and lazy loading, and lets
 * Unsplash do the resizing. It lives in a client component because a loader
 * is a function, and functions cannot be passed from server components.
 */
const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format"); // WebP/AVIF when the browser supports it
  url.searchParams.set("fit", "max");
  return url.toString();
};

export function UnsplashImage(props: Omit<ImageProps, "loader">) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and passed through
  return <Image loader={unsplashLoader} {...props} />;
}
