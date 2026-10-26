import { asc, eq, type SQL } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, productImages, productStock, products } from "@/db/schema";
import type { Category } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/*
 * Cached reads for products and categories. Every read is tagged "products",
 * so a later admin or seed change can call updateTag("products").
 */

type ProductRow = typeof products.$inferSelect & {
  category: typeof categories.$inferSelect;
  stock: (typeof productStock.$inferSelect)[];
  images: (typeof productImages.$inferSelect)[];
};

function toProduct(row: ProductRow): Product {
  const image = {
    src: row.imageSrc,
    alt: row.imageAlt,
    position: row.imagePosition ?? undefined,
  };
  return {
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    price: row.priceCents,
    badge: row.badge,
    category: { slug: row.category.slug, label: row.category.label },
    color: { name: row.colorName, hex: row.colorHex },
    sizes: row.stock.map((s) => ({ label: s.sizeLabel, stock: s.quantity })),
    description: row.description,
    details: row.details,
    image,
    gallery: [
      image,
      ...row.images.map((i) => ({ src: i.src, alt: i.alt, position: i.position ?? undefined })),
    ],
  };
}

async function queryProducts(where?: SQL) {
  const rows = await db.query.products.findMany({
    where,
    with: {
      category: true,
      stock: { orderBy: [asc(productStock.sortOrder)] },
      images: { orderBy: [asc(productImages.sortOrder)] },
    },
    orderBy: [asc(products.id)],
  });
  return rows.map(toProduct);
}

export async function getProductSlugs() {
  "use cache";
  cacheTag("products");

  const rows = await db.select({ slug: products.slug }).from(products).orderBy(asc(products.id));
  return rows.map((r) => r.slug);
}

/*
 * For proxy.ts. 'use cache' doesn't work when called from the proxy, so this
 * keeps a short-lived in-memory copy of the slugs instead. Otherwise every
 * request to /products/* would query the database, including requests for
 * random slugs.
 */
const SLUG_TTL_MS = 60_000;
let knownSlugs: { slugs: Set<string>; expires: number } | null = null;

export async function isKnownProductSlug(slug: string) {
  if (!knownSlugs || knownSlugs.expires < Date.now()) {
    const rows = await db.select({ slug: products.slug }).from(products);
    knownSlugs = {
      slugs: new Set(rows.map((r) => r.slug)),
      expires: Date.now() + SLUG_TTL_MS,
    };
  }
  return knownSlugs.slugs.has(slug);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag("products");

  const [product] = await queryProducts(eq(products.slug, slug));
  return product ?? null;
}

/** Same category first, then the rest; never the product itself. */
export async function getRelatedProducts(slug: string, limit = 8): Promise<Product[]> {
  "use cache";
  cacheTag("products");

  const all = await queryProducts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];

  const others = all.filter((p) => p.slug !== slug);
  return [
    ...others.filter((p) => p.category.slug === current.category.slug),
    ...others.filter((p) => p.category.slug !== current.category.slug),
  ].slice(0, limit);
}

export async function getNewArrivals(): Promise<Product[]> {
  "use cache";
  cacheTag("products");

  return queryProducts();
}

/** Categories shown as tiles in the homepage grid, in display order. */
export async function getHomeCategories(): Promise<Category[]> {
  "use cache";
  cacheTag("products");

  const rows = await db.query.categories.findMany({
    where: eq(categories.showOnHome, true),
    orderBy: [asc(categories.sortOrder)],
  });

  return rows.flatMap((c) =>
    c.imageSrc && c.imageAlt
      ? [
          {
            slug: c.slug,
            label: c.label,
            image: { src: c.imageSrc, alt: c.imageAlt, position: c.imagePosition ?? undefined },
          },
        ]
      : [],
  );
}
