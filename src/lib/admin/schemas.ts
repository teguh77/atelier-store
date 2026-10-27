import { z } from "zod";

import { ONE_SIZE } from "@/lib/products";

/*
 * Validation for admin forms. Shared by the server actions (the real check)
 * and the forms (field names). Everything arrives as FormData strings.
 */

/** One shape for every admin action, used with useActionState. */
export type AdminActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const IDLE: AdminActionResult = { ok: false };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** UnsplashImage and the CSP only allow Unsplash. */
const UNSPLASH = /^https:\/\/images\.unsplash\.com\/[^\s]+$/;

const text = (max: number) => z.string().trim().max(max);
const required = (label: string, max = 200) => text(max).min(1, `Enter ${label}.`);
const optional = (max: number) =>
  text(max).transform((v) => (v === "" ? null : v));

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a URL slug.")
  .max(100)
  .regex(SLUG, "Use lowercase letters, numbers and single hyphens, e.g. leather-tote.");

export const imageUrlSchema = z
  .string()
  .trim()
  .regex(UNSPLASH, "Use an https://images.unsplash.com/… URL.");

/** "2,850", "$2850" or "2850.50" → 285050 cents. */
export const priceSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[$,\s]/g, ""))
  .pipe(z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a price in dollars, e.g. 2850 or 2850.50."))
  .transform((v) => Math.round(Number(v) * 100));

/** Highest stock count for one size. */
export const MAX_STOCK = 9999;

/**
 * A stock count typed by an admin: digits only, 0–9,999. Strict on purpose:
 * z.coerce would turn "" into 0 (wiping stock) and accept "1e3".
 */
export const quantitySchema = z
  .string({ message: "Enter a whole number from 0 to 9,999." })
  .trim()
  .regex(/^\d{1,4}$/, "Enter a whole number from 0 to 9,999.")
  .transform(Number);

/** A stock adjustment: "+5", "5" or "-2". Non-zero, at most ±9,999. */
export const adjustmentSchema = z
  .string({ message: "Enter an amount like +5 or -2." })
  .trim()
  .regex(/^[+-]?\d{1,4}$/, "Enter a whole number like +5 or -2.")
  .transform(Number)
  .refine((n) => n !== 0, "Enter an amount other than 0.");

/**
 * Sizes an admin may not remove: unpaid checkouts still hold units of them,
 * and releasing those units finds the stock row by size name.
 * Returns the message to show, or null when every removal is allowed.
 */
export function sizeRemovalError(removed: string[], heldBySize: Map<string, number>): string | null {
  const blocked = removed.filter((label) => (heldBySize.get(label) ?? 0) > 0);
  if (blocked.length === 0) return null;
  const parts = blocked.map((label) => {
    const n = heldBySize.get(label)!;
    return `${label} (${n} ${n === 1 ? "unit" : "units"})`;
  });
  return `Can't remove ${parts.join(", ")}: held by unpaid checkouts. Try again after they complete or expire.`;
}

/** One per line: "url" or "url | alt text". */
function parseGallery(value: string, productName: string, ctx: z.RefinementCtx) {
  const lines = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 12) {
    ctx.addIssue({ code: "custom", path: ["gallery"], message: "Add at most 12 gallery photos." });
    return [];
  }
  return lines.map((line, i) => {
    const [url, ...altParts] = line.split("|");
    const src = url.trim();
    if (!UNSPLASH.test(src)) {
      ctx.addIssue({ code: "custom", path: ["gallery"], message: `Line ${i + 1}: use an https://images.unsplash.com/… URL.` });
    }
    const alt = altParts.join("|").trim() || `${productName}, view ${i + 2}`;
    return { src, alt };
  });
}

export const productSchema = z
  .object({
    name: required("a name"),
    slug: slugSchema,
    sku: required("a SKU", 50).transform((v) => v.toUpperCase()),
    categoryId: z.coerce.number().int().positive("Choose a category."),
    price: priceSchema,
    badge: optional(40),
    colorName: required("a color name", 60),
    colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #1a1a1a."),
    description: required("a description", 2000),
    details: text(2000).transform((v) =>
      v
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ),
    imageSrc: imageUrlSchema,
    imageAlt: required("alt text for the main photo"),
    imagePosition: optional(40),
    gallery: text(5000),
    // Checkbox: "on" when listed, missing ('') when hidden.
    isActive: z.string().transform((v) => v === "on"),
  })
  .transform((data, ctx) => ({ ...data, gallery: parseGallery(data.gallery, data.name, ctx) }));

export type ProductInput = z.infer<typeof productSchema>;

export type SizesInput = { oneSize: boolean; labels: string[]; quantities: number[]; keepIds: number[] };

/**
 * Sizes from the form. `oneSize` = a single "One size" row. Otherwise:
 * repeated `sizeLabel` + `sizeQty` fields are NEW sizes with their starting
 * stock, and `keepSizeId` lists existing rows to keep (edit only). Existing
 * sizes can't be renamed: order items refer to sizes by label.
 */
export function parseSizes(form: FormData): SizesInput | { error: string } {
  const keepIds = form.getAll("keepSizeId").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (form.get("oneSize") === "on") {
    const qty = Number(form.get("oneSizeQty") || 0);
    if (!Number.isInteger(qty) || qty < 0 || qty > MAX_STOCK) return { error: "Stock must be 0–9,999." };
    return { oneSize: true, labels: [ONE_SIZE], quantities: [qty], keepIds };
  }
  const labels = form.getAll("sizeLabel").map((v) => String(v).trim());
  const quantities = form.getAll("sizeQty").map((v) => Number(v || 0));
  if (labels.length !== quantities.length) return { error: "Something went wrong. Reload and try again." };
  if (labels.some((l) => l === "")) return { error: "Size names can't be empty." };
  if (labels.some((l) => l.length > 20)) return { error: "Keep size names under 20 characters." };
  if (labels.includes(ONE_SIZE)) return { error: `Use the "One size" option instead of a size called "${ONE_SIZE}".` };
  if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) return { error: "Each size must be different." };
  if (quantities.some((q) => !Number.isInteger(q) || q < 0 || q > MAX_STOCK)) return { error: "Stock must be 0–9,999." };
  return { oneSize: false, labels, quantities, keepIds };
}

export const categorySchema = z
  .object({
    label: required("a name", 60),
    slug: slugSchema,
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    showOnHome: z.string().optional().transform((v) => v === "on"),
    imageSrc: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .pipe(imageUrlSchema.nullable()),
    imageAlt: optional(200),
    imagePosition: optional(40),
  })
  .superRefine((c, ctx) => {
    if (c.showOnHome && !c.imageSrc) {
      ctx.addIssue({ code: "custom", path: ["imageSrc"], message: "Homepage categories need a photo." });
    }
    if (c.imageSrc && !c.imageAlt) {
      ctx.addIssue({ code: "custom", path: ["imageAlt"], message: "Describe the photo for screen readers." });
    }
  });

export type CategoryInput = z.infer<typeof categorySchema>;

/** First error per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Postgres error code and constraint, through the Neon/Drizzle wrappers. */
export function pgError(error: unknown): { code?: string; constraint?: string } {
  const e = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  return { code: e?.code ?? e?.cause?.code, constraint: e?.constraint ?? e?.cause?.constraint };
}
