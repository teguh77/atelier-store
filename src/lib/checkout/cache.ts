import { revalidateTag } from "next/cache";

/**
 * Checkout took or returned stock: refresh the cached product pages and
 * listings ("products" tag) so their sold-out and low-stock states catch up.
 * "max" = stale-while-revalidate: the next visitor triggers a fresh render.
 * The bag and checkout don't depend on this; they always read live stock.
 *
 * Kept out of orders.ts so that file has no Next.js imports (tests use it).
 * Works in server actions and route handlers (the Stripe webhook).
 */
export function stockChanged() {
  revalidateTag("products", "max");
}
