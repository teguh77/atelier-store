import { NextResponse, type NextRequest } from "next/server";

import { products } from "@/lib/products";

const knownSlugs = new Set(products.map((p) => p.slug));

/*
 * Unknown product URLs get a real 404 status.
 *
 * With Cache Components the product page streams its static shell before
 * the page can call notFound(), which locks the status at 200. Checking here,
 * before rendering, lets Next serve the not-found page with a 404 instead.
 * Rewriting to a path no route matches renders app/not-found.tsx as a 404.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !knownSlugs.has(decodeURIComponent(slug))) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/products/:slug",
};
