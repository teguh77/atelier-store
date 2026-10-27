import { cache } from "react";

import { ONE_SIZE } from "@/lib/products";

import { readCartCookie } from "./cookie";
import { getLiveProducts, type LiveProduct } from "./queries";
import { maxQuantity, type Cart, type CartLine, type StoredLine } from "./rules";

/**
 * Checks stored lines against live products and prices them.
 * - Product or size gone → line dropped (counted in removedCount).
 * - Size sold out → line kept as "sold-out", quantity 0, not in the subtotal.
 * - More in the bag than stock allows → quantity lowered, status "reduced".
 * Returns the priced cart and the corrected lines to save on the next write.
 */
export function buildCart(
  stored: StoredLine[],
  live: Map<string, LiveProduct>,
): { cart: Cart; corrected: StoredLine[] } {
  const lines: CartLine[] = [];
  const corrected: StoredLine[] = [];
  let removedCount = 0;

  for (const item of stored) {
    const product = live.get(item.slug);
    const stock = product?.stock.get(item.size);
    if (!product || stock === undefined) {
      removedCount++;
      continue;
    }

    const max = maxQuantity(stock);
    const soldOut = max === 0;
    const quantity = soldOut ? 0 : Math.min(item.quantity, max);
    const status = soldOut ? "sold-out" : quantity < item.quantity ? "reduced" : "ok";

    lines.push({
      slug: item.slug,
      size: item.size,
      showSize: item.size !== ONE_SIZE,
      name: product.name,
      colorName: product.colorName,
      image: product.image,
      unitPrice: product.priceCents,
      quantity,
      maxQuantity: max,
      // max = min(stock, MAX_PER_ITEM), so they're equal when stock is the limit.
      limitedByStock: stock === max,
      lineTotal: product.priceCents * quantity,
      status,
    });
    // Sold-out lines stay in the cookie so the customer sees what happened.
    corrected.push({ ...item, quantity: soldOut ? item.quantity : quantity });
  }

  const available = lines.filter((l) => l.status !== "sold-out");
  return {
    cart: {
      lines,
      count: available.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: available.reduce((sum, l) => sum + l.lineTotal, 0),
      removedCount,
    },
    corrected,
  };
}

/** Reads the cookie, then live prices and stock. Shared per request. */
export const getCart = cache(async (): Promise<Cart> => {
  const stored = await readCartCookie();
  const live = await getLiveProducts(stored.map((l) => l.slug));
  return buildCart(stored, live).cart;
});
