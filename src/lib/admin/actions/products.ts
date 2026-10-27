"use server";

import { asc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { productImages, productStock, products } from "@/db/schema";
import {
  fieldErrors,
  parseSizes,
  pgError,
  productSchema,
  sizeRemovalError,
  type AdminActionResult,
  type ProductInput,
} from "@/lib/admin/schemas";
import { deleteUnheldSizesStatements, heldUnits, SIZE_HELD_ERROR, sizeKey } from "@/lib/inventory";
import { forgetKnownSlugs } from "@/lib/product-queries";
import { ONE_SIZE } from "@/lib/products";
import { assertAdmin } from "@/lib/session";

/*
 * Product writes. EVERY exported function starts with `await assertAdmin()`:
 * server actions are public endpoints, so the admin layout doesn't protect them.
 * Multi-row writes go through db.batch (one transaction on Neon HTTP).
 */

type Batch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

const PRODUCT_FIELDS = [
  "name", "slug", "sku", "categoryId", "price", "badge", "colorName", "colorHex",
  "description", "details", "imageSrc", "imageAlt", "imagePosition", "gallery", "isActive",
] as const;

function readProduct(form: FormData) {
  const raw = Object.fromEntries(PRODUCT_FIELDS.map((k) => [k, String(form.get(k) ?? "")]));
  return productSchema.safeParse(raw);
}

function productValues(p: ProductInput) {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categoryId,
    priceCents: p.price,
    badge: p.badge,
    colorName: p.colorName,
    colorHex: p.colorHex.toLowerCase(),
    description: p.description,
    details: p.details,
    imageSrc: p.imageSrc,
    imageAlt: p.imageAlt,
    imagePosition: p.imagePosition,
    isActive: p.isActive,
  };
}

/** Turns known database errors into form errors; anything else is rethrown. */
function writeError(error: unknown): AdminActionResult {
  const { code, constraint } = pgError(error);
  if (code === "23505" && constraint?.includes("slug")) {
    return { ok: false, fieldErrors: { slug: "Another product already uses this slug." } };
  }
  if (code === "23505" && constraint?.includes("sku")) {
    return { ok: false, fieldErrors: { sku: "Another product already uses this SKU." } };
  }
  if (code === "23503") return { ok: false, fieldErrors: { categoryId: "That category no longer exists." } };
  if (code === SIZE_HELD_ERROR) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { sizes: "A checkout just reserved one of the sizes you're removing. Nothing was saved; try again after it completes or expires." },
    };
  }
  console.error("[admin] Product write failed:", (error as Error).message);
  return { ok: false, message: "Couldn't save the product. Please try again." };
}

function afterWrite() {
  updateTag("products");
  forgetKnownSlugs();
}

export async function createProduct(_prev: AdminActionResult, form: FormData): Promise<AdminActionResult> {
  await assertAdmin();

  const parsed = readProduct(form);
  const sizes = parseSizes(form);
  if (!parsed.success || "error" in sizes || sizes.labels.length === 0) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: {
        ...(parsed.success ? {} : fieldErrors(parsed.error)),
        ...("error" in sizes ? { sizes: sizes.error } : sizes.labels.length === 0 ? { sizes: "Add at least one size." } : {}),
      },
    };
  }
  const p = parsed.data;

  let id: number;
  try {
    // Reserve the id so the product, its stock and photos insert in one batch.
    const result = await db.execute<{ id: number }>(
      sql`SELECT nextval(pg_get_serial_sequence('products', 'id'))::int AS id`,
    );
    id = result.rows[0].id;

    const statements: Batch = [
      db.insert(products).values({ id, ...productValues(p) }),
      db.insert(productStock).values(
        sizes.labels.map((label, i) => ({ productId: id, sizeLabel: label, quantity: sizes.quantities[i], sortOrder: i })),
      ),
    ];
    if (p.gallery.length > 0) {
      statements.push(
        db.insert(productImages).values(p.gallery.map((img, i) => ({ productId: id, sortOrder: i + 1, ...img }))),
      );
    }
    await db.batch(statements);
  } catch (error) {
    return writeError(error);
  }

  afterWrite();
  redirect(`/admin/products/${id}?saved=created`);
}

export async function updateProduct(_prev: AdminActionResult, form: FormData): Promise<AdminActionResult> {
  await assertAdmin();

  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Unknown product." };

  const parsed = readProduct(form);
  const sizes = parseSizes(form);
  if (!parsed.success || "error" in sizes) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: {
        ...(parsed.success ? {} : fieldErrors(parsed.error)),
        ...("error" in sizes ? { sizes: sizes.error } : {}),
      },
    };
  }
  const p = parsed.data;

  try {
    const existing = await db
      .select({ id: productStock.id, sizeLabel: productStock.sizeLabel })
      .from(productStock)
      .where(eq(productStock.productId, id))
      .orderBy(asc(productStock.sortOrder), asc(productStock.id));
    const found = await db.query.products.findFirst({ where: eq(products.id, id), columns: { id: true } });
    if (!found) return { ok: false, message: "This product no longer exists." };

    // Which existing size rows stay, and which sizes are new.
    const keep = sizes.oneSize
      ? existing.filter((s) => s.sizeLabel === ONE_SIZE)
      : existing.filter((s) => s.sizeLabel !== ONE_SIZE && sizes.keepIds.includes(s.id));
    const added = sizes.oneSize
      ? keep.length > 0
        ? []
        : [{ label: ONE_SIZE, quantity: sizes.quantities[0] }]
      : sizes.labels.map((label, i) => ({ label, quantity: sizes.quantities[i] }));
    const removed = existing.filter((s) => !keep.includes(s));

    const keptLabels = new Set(keep.map((s) => s.sizeLabel.toLowerCase()));
    if (added.some((a) => keptLabels.has(a.label.toLowerCase()))) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: { sizes: "That size already exists." } };
    }
    if (keep.length + added.length === 0) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: { sizes: "Keep at least one size." } };
    }
    // Unpaid checkouts release units back by size name; their size must still exist.
    if (removed.length > 0) {
      const held = await heldUnits([id]);
      const heldBySize = new Map(removed.map((s) => [s.sizeLabel, held.get(sizeKey(id, s.sizeLabel)) ?? 0]));
      const blocked = sizeRemovalError(removed.map((s) => s.sizeLabel), heldBySize);
      if (blocked) return { ok: false, message: "Check the highlighted fields.", fieldErrors: { sizes: blocked } };
    }

    const statements: Batch = [
      db.update(products).set({ ...productValues(p), updatedAt: new Date() }).where(eq(products.id, id)),
      // Gallery: replace all rows (sort_order is unique per product).
      db.delete(productImages).where(eq(productImages.productId, id)),
    ];
    if (removed.length > 0) {
      // Re-checks "held by an unpaid checkout" inside this transaction (the check
      // above can race with a checkout that starts in between).
      statements.push(...deleteUnheldSizesStatements(removed.map((s) => s.id)));
    }
    keep.forEach((s, i) => statements.push(db.update(productStock).set({ sortOrder: i }).where(eq(productStock.id, s.id))));
    if (added.length > 0) {
      statements.push(
        db.insert(productStock).values(
          added.map((a, i) => ({ productId: id, sizeLabel: a.label, quantity: a.quantity, sortOrder: keep.length + i })),
        ),
      );
    }
    if (p.gallery.length > 0) {
      statements.push(
        db.insert(productImages).values(p.gallery.map((img, i) => ({ productId: id, sortOrder: i + 1, ...img }))),
      );
    }
    await db.batch(statements);
  } catch (error) {
    return writeError(error);
  }

  afterWrite();
  refresh();
  return { ok: true, message: "Product saved." };
}
