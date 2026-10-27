/*
 * Cart rules and types shared by the server (actions, bag page) and the
 * client (quantity controls). Prices are integer cents and always come from
 * the database, never from the client or the cart cookie.
 */

import type { Photo } from "@/lib/catalog";
import { MAX_PER_ITEM } from "@/lib/products";

/** Most lines the cart cookie holds. Keeps the cookie well under 4 KB. */
export const MAX_LINES = 30;

/** What the cart cookie stores: which product, which size, how many. */
export type StoredLine = { slug: string; size: string; quantity: number };

export type CartLineStatus =
  /** Quantity is fine. */
  | "ok"
  /** Stock dropped below what was in the bag; the quantity was lowered. */
  | "reduced"
  /** This size is out of stock. Shown, but not counted in the subtotal. */
  | "sold-out";

export type CartLine = {
  slug: string;
  size: string;
  /** False for one-size items, which don't show a size. */
  showSize: boolean;
  name: string;
  colorName: string;
  image: Photo;
  /** Cents, read live from the database. */
  unitPrice: number;
  /** After lowering to live stock. 0 when sold out. */
  quantity: number;
  /** Most this line can hold right now: min(stock, MAX_PER_ITEM). */
  maxQuantity: number;
  /** True when stock, not the per-item limit, sets maxQuantity. */
  limitedByStock: boolean;
  /** unitPrice × quantity, in cents. */
  lineTotal: number;
  status: CartLineStatus;
};

export type Cart = {
  lines: CartLine[];
  /** Units that can be bought (sold-out lines excluded). */
  count: number;
  /** Cents. Sum of the available lines. */
  subtotal: number;
  /** Lines dropped because the product or size no longer exists. */
  removedCount: number;
};

/** Most units of one size the bag may hold, given live stock. */
export function maxQuantity(stock: number) {
  return Math.max(0, Math.min(stock, MAX_PER_ITEM));
}

export function sameLine(a: { slug: string; size: string }, b: { slug: string; size: string }) {
  return a.slug === b.slug && a.size === b.size;
}
