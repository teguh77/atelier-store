"use server";

import { refresh, updateTag } from "next/cache";

import { adjustmentSchema, quantitySchema, type AdminActionResult } from "@/lib/admin/schemas";
import { adjustStock, setStock, type StockWriteResult } from "@/lib/inventory";
import { assertAdmin } from "@/lib/session";

/*
 * Stock writes. EVERY exported function starts with `await assertAdmin()`:
 * server actions are public endpoints, so the admin layout doesn't protect them.
 * The SQL lives in src/lib/inventory.ts (single statements, safe with
 * concurrent checkouts); this file adds validation, messages and the cache refresh.
 */

export type StockActionResult = AdminActionResult & {
  /** The stock count after the action, or the current one when it was refused. */
  current?: number;
};

const RELOAD: StockActionResult = { ok: false, message: "Something went wrong. Reload the page and try again." };

function stockId(form: FormData) {
  const id = Number(form.get("stockId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Turns a refused write into a message the admin can act on. */
function refusal(result: Exclude<StockWriteResult, { ok: true }>): StockActionResult {
  switch (result.reason) {
    case "missing":
      return { ok: false, message: "This size no longer exists. Reload the page." };
    case "conflict":
      return {
        ok: false,
        current: result.current,
        message: `Stock changed to ${result.current} since you loaded this page. Review it and save again.`,
      };
    case "below-zero":
      return { ok: false, current: result.current, message: `That would take stock below 0 (it's ${result.current}).` };
    case "above-max":
      return { ok: false, current: result.current, message: `That would take stock above 9,999 (it's ${result.current}).` };
  }
}

function failed(error: unknown): StockActionResult {
  console.error("[admin] Stock write failed:", (error as Error).message);
  return { ok: false, message: "Couldn't save the stock. Please try again." };
}

/** Set a size's stock to a number, only if it still has the value the admin saw. */
export async function updateStock(_prev: StockActionResult, form: FormData): Promise<StockActionResult> {
  await assertAdmin();

  const id = stockId(form);
  const expected = Number(form.get("expected"));
  if (id === null || !Number.isInteger(expected) || expected < 0) return RELOAD;
  const next = quantitySchema.safeParse(form.get("quantity"));
  if (!next.success) return { ok: false, message: next.error.issues[0].message };
  if (next.data === expected) return { ok: true, current: expected, message: "No change." };

  let result: StockWriteResult;
  try {
    result = await setStock(id, expected, next.data);
  } catch (error) {
    return failed(error);
  }
  refresh();
  if (!result.ok) return refusal(result);
  updateTag("products");
  return { ok: true, current: result.quantity, message: "Saved." };
}

/** Add or remove units (restock, damage, count correction) without a conflict check. */
export async function adjustStockLevel(_prev: StockActionResult, form: FormData): Promise<StockActionResult> {
  await assertAdmin();

  const id = stockId(form);
  if (id === null) return RELOAD;
  const delta = adjustmentSchema.safeParse(form.get("delta"));
  if (!delta.success) return { ok: false, message: delta.error.issues[0].message };

  let result: StockWriteResult;
  try {
    result = await adjustStock(id, delta.data);
  } catch (error) {
    return failed(error);
  }
  refresh();
  if (!result.ok) return refusal(result);
  updateTag("products");
  const verb = delta.data > 0 ? `Added ${delta.data}` : `Removed ${-delta.data}`;
  return { ok: true, current: result.quantity, message: `${verb}. Now ${result.quantity}.` };
}
