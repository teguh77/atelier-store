import { NextResponse, type NextRequest } from "next/server";

import { customerHasOrder, parseOrderNumber } from "@/lib/account-orders";
import { auth } from "@/lib/auth";
import { isKnownCategorySlug, isKnownProductSlug } from "@/lib/product-queries";

/*
 * Unknown product and collection URLs get a real 404 status.
 *
 * With Cache Components the product page streams its static shell before
 * the page can call notFound(), which locks the status at 200. Checking here,
 * before rendering, lets Next serve the not-found page with a 404 instead.
 * Rewriting to a path no route matches renders app/not-found.tsx as a 404.
 *
 * The same applies to account and admin pages. The proxy checks the session
 * before streaming, so non-admins get a 404 status and signed-out visitors
 * get a redirect. The layouts repeat these checks on the server.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, section, raw] = pathname.split("/");

  if (section === "account" || section === "admin") {
    return guardPrivateRoute(request, section);
  }

  if (raw) {
    const slug = safeDecode(raw);
    if (slug === null || !(await isKnownPath(section, slug))) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }
  return NextResponse.next();
}

async function guardPrivateRoute(request: NextRequest, section: "account" | "admin") {
  const session = await auth.api.getSession({ headers: request.headers });

  if (section === "account" && !session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  if (section === "admin" && session?.user.role !== "admin") {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  // No admin dashboard yet: products is the admin home. After the role check,
  // so non-admins still get a 404 for /admin.
  if (section === "admin" && request.nextUrl.pathname.replace(/\/$/, "") === "/admin") {
    return NextResponse.redirect(new URL("/admin/products", request.url));
  }

  // /account/orders/<number>: a real 404 unless it's this customer's order.
  const [, , sub, raw, extra] = request.nextUrl.pathname.split("/");
  if (section === "account" && session && sub === "orders" && raw && extra === undefined) {
    const orderNumber = parseOrderNumber(raw);
    if (orderNumber === null || !(await customerHasOrder(session.user.id, orderNumber))) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }
  return NextResponse.next();
}

async function isKnownPath(section: string, slug: string) {
  if (section === "products") return isKnownProductSlug(slug);
  // "new-in" is a static route, not a category.
  if (section === "collections") return slug === "new-in" || isKnownCategorySlug(slug);
  return true;
}

/** Malformed escapes such as "%E0%A4%A" throw in decodeURIComponent. */
function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/products/:slug",
    "/collections/:slug",
    "/account",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
