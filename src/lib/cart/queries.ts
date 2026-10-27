import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { productStock, products } from "@/db/schema";

/*
 * Live product data for the cart. Deliberately NOT cached ('use cache'):
 * the cart must see current prices and stock, while the product pages may
 * show cached values for a while.
 */

export type LiveProduct = {
  id: number;
  slug: string;
  name: string;
  colorName: string;
  /** Cents. */
  priceCents: number;
  image: { src: string; alt: string; position?: string };
  /** Size label → units in stock. */
  stock: Map<string, number>;
  /** Size label → product_stock row id (checkout locks and decrements these). */
  stockIds: Map<string, number>;
};

export async function getLiveProducts(slugs: string[]): Promise<Map<string, LiveProduct>> {
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return new Map();

  const rows = await db.query.products.findMany({
    // Hidden products drop out of the bag like deleted ones (counted as removed).
    where: and(inArray(products.slug, unique), eq(products.isActive, true)),
    with: { stock: { orderBy: [asc(productStock.sortOrder)] } },
  });

  return new Map(
    rows.map((row) => [
      row.slug,
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        colorName: row.colorName,
        priceCents: row.priceCents,
        image: { src: row.imageSrc, alt: row.imageAlt, position: row.imagePosition ?? undefined },
        stock: new Map(row.stock.map((s) => [s.sizeLabel, s.quantity])),
        stockIds: new Map(row.stock.map((s) => [s.sizeLabel, s.id])),
      },
    ]),
  );
}
