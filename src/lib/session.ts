import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/*
 * Server-side session checks. These read request headers, so call them only
 * inside a route-group layout or page that is wrapped in Suspense, never in
 * the storefront layout (which stays static).
 */

/** Cached per request, so a layout and its page share one lookup. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Signed-in customers only. Anyone else goes to sign-in, then back to `next`. */
export async function requireUser(next: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session;
}

/** Admins only. Everyone else gets a 404, so the admin area isn't revealed. */
export async function requireAdmin() {
  const session = await getSession();
  if (session?.user.role !== "admin") notFound();
  return session;
}

/**
 * For server actions. Actions are public POST endpoints, so the proxy and
 * layouts don't protect them: call this first in every admin action. Throws
 * instead of notFound()/redirect(), so a failed check can't look like success.
 */
export async function assertAdmin() {
  const session = await getSession();
  if (session?.user.role !== "admin") throw new Error("Not authorized.");
  return session;
}

/** Only same-site paths. Anything else falls back to `fallback`. */
export function safeRedirect(value: string | string[] | undefined, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
