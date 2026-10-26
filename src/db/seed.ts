/*
 * Seeds categories, products and stock from src/db/seed/data.ts.
 * Idempotent: categories and products upsert by slug, and stock for each
 * seeded product is replaced. Run with `pnpm db:seed`.
 *
 * Builds its own client instead of importing src/db, so it doesn't need the
 * Better Auth variables that src/lib/env.ts requires.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, sql } from "drizzle-orm";

import {
  categories as categoryData,
  galleries,
  products as productData,
} from "./seed/data";
import { categories, productImages, productStock, products } from "./schema";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.example.");
}

const db = drizzle({
  client: neon(process.env.DATABASE_URL),
  schema: { categories, products, productStock, productImages },
});

async function seed() {
  const categoryRows = await db
    .insert(categories)
    .values(
      categoryData.map((c, i) => ({
        slug: c.slug,
        label: c.label,
        sortOrder: i,
        showOnHome: c.showOnHome,
        imageSrc: c.image?.src ?? null,
        imageAlt: c.image?.alt ?? null,
        imagePosition: c.image?.position ?? null,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        label: sql`excluded.label`,
        sortOrder: sql`excluded.sort_order`,
        showOnHome: sql`excluded.show_on_home`,
        imageSrc: sql`excluded.image_src`,
        imageAlt: sql`excluded.image_alt`,
        imagePosition: sql`excluded.image_position`,
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIds = new Map(categoryRows.map((c) => [c.slug, c.id]));

  const productRows = await db
    .insert(products)
    .values(
      productData.map((p) => {
        const categoryId = categoryIds.get(p.category);
        if (categoryId === undefined) {
          throw new Error(`Unknown category "${p.category}" for product "${p.slug}".`);
        }
        return {
          slug: p.slug,
          sku: p.sku,
          name: p.name,
          description: p.description,
          priceCents: p.price,
          badge: p.badge ?? null,
          colorName: p.color.name,
          colorHex: p.color.hex,
          details: p.details,
          imageSrc: p.image.src,
          imageAlt: p.image.alt,
          imagePosition: p.image.position ?? null,
          categoryId,
          updatedAt: new Date(),
        };
      }),
    )
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        sku: sql`excluded.sku`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        priceCents: sql`excluded.price_cents`,
        badge: sql`excluded.badge`,
        colorName: sql`excluded.color_name`,
        colorHex: sql`excluded.color_hex`,
        details: sql`excluded.details`,
        imageSrc: sql`excluded.image_src`,
        imageAlt: sql`excluded.image_alt`,
        imagePosition: sql`excluded.image_position`,
        categoryId: sql`excluded.category_id`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning({ id: products.id, slug: products.slug });

  const productIds = new Map(productRows.map((p) => [p.slug, p.id]));
  const stockRows = productData.flatMap((p) =>
    p.sizes.map((s, i) => ({
      productId: productIds.get(p.slug)!,
      sizeLabel: s.label,
      quantity: s.stock,
      sortOrder: i,
    })),
  );

  const imageRows = productData.flatMap((p) =>
    (galleries[p.slug] ?? []).map((photo, i) => ({
      productId: productIds.get(p.slug)!,
      sortOrder: i + 1,
      src: photo.src,
      alt: photo.alt,
    })),
  );

  // Replace stock and gallery photos for the seeded products in one transaction.
  const productIdList = [...productIds.values()];
  const deleteStock = db.delete(productStock).where(inArray(productStock.productId, productIdList));
  const deleteImages = db.delete(productImages).where(inArray(productImages.productId, productIdList));
  if (imageRows.length > 0) {
    await db.batch([
      deleteStock,
      db.insert(productStock).values(stockRows),
      deleteImages,
      db.insert(productImages).values(imageRows),
    ]);
  } else {
    await db.batch([deleteStock, db.insert(productStock).values(stockRows), deleteImages]);
  }

  console.log(
    `Seeded ${categoryRows.length} categories, ${productRows.length} products, ${stockRows.length} stock rows, ${imageRows.length} gallery photos.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
