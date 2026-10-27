import { cookies } from "next/headers";
import { z } from "zod";

import { env } from "@/lib/env";

import { MAX_LINES, sameLine, type StoredLine } from "./rules";

/*
 * The cart lives in one httpOnly cookie: a JSON list of { slug, size, quantity }.
 * It never holds prices or names. Anything in it is treated as untrusted:
 * bad entries are dropped here, and quantities are checked against live
 * stock when the cart is built (src/lib/cart/build.ts).
 */

const COOKIE_NAME = "atelier-cart";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const storedLineSchema = z.object({
  slug: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
  quantity: z.number().int().positive(),
});

/** Parses the cookie value. Never throws; a damaged cookie reads as an empty cart. */
export function parseCartValue(value: string | undefined): StoredLine[] {
  if (!value) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const lines: StoredLine[] = [];
  for (const entry of raw) {
    const parsed = storedLineSchema.safeParse(entry);
    if (!parsed.success) continue;
    // Merge duplicates of the same product and size.
    const existing = lines.find((l) => sameLine(l, parsed.data));
    if (existing) existing.quantity += parsed.data.quantity;
    else lines.push({ ...parsed.data });
  }
  return lines.slice(0, MAX_LINES);
}

export async function readCartCookie(): Promise<StoredLine[]> {
  const store = await cookies();
  return parseCartValue(store.get(COOKIE_NAME)?.value);
}

/** Only call from a Server Action. An empty cart deletes the cookie. */
export async function writeCartCookie(lines: StoredLine[]) {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(COOKIE_NAME);
    return;
  }
  const value = JSON.stringify(
    lines.slice(0, MAX_LINES).map(({ slug, size, quantity }) => ({ slug, size, quantity })),
  );
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}
