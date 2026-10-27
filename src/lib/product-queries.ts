import { and, asc, desc, eq, type SQL } from "drizzle-orm";
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

/** Storefront reads: listed products only (is_active). */
const listed = eq(products.isActive, true);

async function queryProducts(where?: SQL, orderBy: SQL[] = [asc(products.id)]) {
  const rows = await db.query.products.findMany({
    where: where ? and(listed, where) : listed,
    with: {
      category: true,
      stock: { orderBy: [asc(productStock.sortOrder)] },
      images: { orderBy: [asc(productImages.sortOrder)] },
    },
    orderBy,
  });
  return rows.map(toProduct);
}

export async function getProductSlugs() {
  "use cache";
  cacheTag("products");

  const rows = await db.select({ slug: products.slug }).from(products).where(listed).orderBy(asc(products.id));
  return rows.map((r) => r.slug);
}

export async function getCategorySlugs() {
  "use cache";
  cacheTag("products");

  const rows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder));
  return rows.map((r) => r.slug);
}

/*
 * For proxy.ts. 'use cache' doesn't work when called from the proxy, so this
 * keeps a short-lived in-memory copy of the slugs instead. Otherwise every
 * request to /products/* would query the database, including requests for
 * random slugs.
 */
const SLUG_TTL_MS = 60_000;

type SlugCache = { slugs: Set<string>; expires: number } | null;

/*
 * Kept on globalThis, not in module scope: the proxy is bundled separately
 * from pages and server actions, so a module-level cache would give each its
 * own copy and forgetKnownSlugs() (called from admin actions) would never
 * reach the proxy's. globalThis is shared within one server process.
 */
const slugCaches: Map<string, SlugCache> = ((globalThis as { __atelierSlugCaches?: Map<string, SlugCache> })
  .__atelierSlugCaches ??= new Map());

function createSlugChecker(name: string, loadSlugs: () => Promise<string[]>) {
  return async (slug: string) => {
    let known = slugCaches.get(name);
    if (!known || known.expires < Date.now()) {
      known = { slugs: new Set(await loadSlugs()), expires: Date.now() + SLUG_TTL_MS };
      slugCaches.set(name, known);
    }
    return known.slugs.has(slug);
  };
}

/**
 * Call after an admin adds, renames, hides or lists a product or category,
 * so the proxy on this server process sees the change on the next request.
 * Other server processes catch up within SLUG_TTL_MS.
 */
export function forgetKnownSlugs() {
  slugCaches.clear();
}

export const isKnownProductSlug = createSlugChecker("products", async () =>
  (await db.select({ slug: products.slug }).from(products).where(listed)).map((r) => r.slug),
);

export const isKnownCategorySlug = createSlugChecker("categories", async () =>
  (await db.select({ slug: categories.slug }).from(categories)).map((r) => r.slug),
);

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

/** Every product, by id. Search filters this list. */
export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("products");

  return queryProducts();
}

/** A category's products (by id) with its label. Null when the slug is unknown. */
export async function getCategoryCollection(slug: string) {
  "use cache";
  cacheTag("products");

  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) return null;

  const items = await queryProducts(eq(products.categoryId, category.id));
  return { label: category.label, products: items };
}

/** Newest first. Products seeded in one batch share created_at, so id breaks the tie. */
export async function getNewArrivals(): Promise<Product[]> {
  "use cache";
  cacheTag("products");

  return queryProducts(undefined, [desc(products.createdAt), desc(products.id)]);
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
