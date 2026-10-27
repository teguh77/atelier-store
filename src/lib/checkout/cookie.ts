import { cookies } from "next/headers";
import { z } from "zod";

import { env } from "@/lib/env";

/*
 * Remembers which order this browser started checking out, so the cancel
 * and success pages can act only on their own order. Holds an order id only.
 */

const COOKIE_NAME = "atelier-checkout";
const orderIdSchema = z.uuid();

export async function readCheckoutCookie(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  const parsed = orderIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Only call from a Server Action. */
export async function setCheckoutCookie(orderId: string) {
  (await cookies()).set(COOKIE_NAME, orderId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

/** Only call from a Server Action. */
export async function clearCheckoutCookie() {
  (await cookies()).delete(COOKIE_NAME);
}
