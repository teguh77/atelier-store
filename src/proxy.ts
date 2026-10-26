import { NextResponse, type NextRequest } from "next/server";

import { productExists } from "@/lib/product-queries";

/*
 * Unknown product URLs get a real 404 status.
 *
 * With Cache Components the product page streams its static shell before
 * the page can call notFound(), which locks the status at 200. Checking here,
 * before rendering, lets Next serve the not-found page with a 404 instead.
 * Rewriting to a path no route matches renders app/not-found.tsx as a 404.
 */
export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !(await productExists(decodeURIComponent(slug)))) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/products/:slug",
};
