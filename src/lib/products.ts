/*
 * Product types and stock rules. Product data itself comes from Postgres
 * through src/lib/product-queries.ts.
 */

import type { Photo } from "./catalog";

export type SizeOption = { label: string; stock: number };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  /** Cents. */
  price: number;
  badge: string | null;
  category: { slug: string; label: string };
  color: { name: string; hex: string };
  /** In display order. */
  sizes: SizeOption[];
  description: string;
  details: string[];
  /** Used on cards (homepage, related products). */
  image: Photo;
  /** Product page photos in order. The first one is `image`. */
  gallery: Photo[];
};

export const ONE_SIZE = "One size";

/** At or below this, a size counts as "low stock". */
export const LOW_STOCK_THRESHOLD = 3;

/** Most units of one size a customer can hold in the bag. */
export const MAX_PER_ITEM = 5;

export function isOneSize(product: Product) {
  return product.sizes.length === 1 && product.sizes[0].label === ONE_SIZE;
}

export function totalStock(product: Product) {
  return product.sizes.reduce((sum, s) => sum + s.stock, 0);
}

export type StockState =
  | { kind: "in-stock" }
  | { kind: "low-stock"; left: number }
  | { kind: "out-of-stock" };

export function stockState(stock: number): StockState {
  if (stock <= 0) return { kind: "out-of-stock" };
  if (stock <= LOW_STOCK_THRESHOLD) return { kind: "low-stock", left: stock };
  return { kind: "in-stock" };
}
