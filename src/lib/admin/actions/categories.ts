"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { categorySchema, fieldErrors, pgError, type AdminActionResult } from "@/lib/admin/schemas";
import { forgetKnownSlugs } from "@/lib/product-queries";
import { assertAdmin } from "@/lib/session";

/*
 * Category writes. EVERY exported function starts with `await assertAdmin()`.
 */

const FIELDS = ["label", "slug", "sortOrder", "showOnHome", "imageSrc", "imageAlt", "imagePosition"] as const;

function readCategory(form: FormData) {
  const raw = Object.fromEntries(FIELDS.map((k) => [k, form.get(k) === null ? undefined : String(form.get(k))]));
  return categorySchema.safeParse(raw);
}

function writeError(error: unknown): AdminActionResult {
  const { code, constraint } = pgError(error);
  if (code === "23505" && constraint?.includes("slug")) {
    return { ok: false, fieldErrors: { slug: "Another category already uses this slug." } };
  }
  console.error("[admin] Category write failed:", (error as Error).message);
  return { ok: false, message: "Couldn't save the category. Please try again." };
}

function afterWrite() {
  updateTag("products");
  forgetKnownSlugs();
}

export async function createCategory(_prev: AdminActionResult, form: FormData): Promise<AdminActionResult> {
  await assertAdmin();

  const parsed = readCategory(form);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    await db.insert(categories).values(parsed.data);
  } catch (error) {
    return writeError(error);
  }
  afterWrite();
  refresh();
  return { ok: true, message: `Added ${parsed.data.label}.` };
}

export async function updateCategory(_prev: AdminActionResult, form: FormData): Promise<AdminActionResult> {
  await assertAdmin();

  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Unknown category." };
  const parsed = readCategory(form);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    const updated = await db
      .update(categories)
      .set(parsed.data)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (updated.length === 0) return { ok: false, message: "This category no longer exists." };
  } catch (error) {
    return writeError(error);
  }
  afterWrite();
  refresh();
  return { ok: true, message: "Category saved." };
}

/** Only empty categories: products reference categories with ON DELETE RESTRICT. */
export async function deleteCategory(_prev: AdminActionResult, form: FormData): Promise<AdminActionResult> {
  await assertAdmin();

  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Unknown category." };
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    if (pgError(error).code === "23503") {
      return { ok: false, message: "This category still has products. Move them to another category first." };
    }
    console.error("[admin] Category delete failed:", (error as Error).message);
    return { ok: false, message: "Couldn't delete the category. Please try again." };
  }
  afterWrite();
  redirect("/admin/categories?deleted=1");
}
