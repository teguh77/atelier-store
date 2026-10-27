import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { orderItems, orders, productStock } from "@/db/schema";
import { MAX_STOCK } from "@/lib/admin/schemas";

/*
 * Stock writes for admins, as single SQL statements so they're safe with
 * concurrent checkouts (which also change product_stock.quantity).
 *
 * No Next.js imports here: the server actions in src/lib/admin/actions/stock.ts
 * add the admin check and cache refresh, and tests call these directly.
 * product_stock.quantity is "available to sell": units held by unpaid
 * checkouts have already been taken off it (see reserveOrder).
 */

export type StockWriteResult =
  | { ok: true; quantity: number }
  | { ok: false; reason: "conflict" | "below-zero" | "above-max"; current: number }
  | { ok: false; reason: "missing" };

async function currentQuantity(stockId: number) {
  const row = await db.query.productStock.findFirst({
    where: eq(productStock.id, stockId),
    columns: { quantity: true },
  });
  return row?.quantity ?? null;
}

/**
 * Compare-and-set: applies only if stock still equals `expected` (what the
 * admin saw). Otherwise nothing changes and the current value is returned.
 */
export async function setStock(stockId: number, expected: number, next: number): Promise<StockWriteResult> {
  const updated = await db
    .update(productStock)
    .set({ quantity: next })
    .where(and(eq(productStock.id, stockId), eq(productStock.quantity, expected)))
    .returning({ quantity: productStock.quantity });
  if (updated.length > 0) return { ok: true, quantity: updated[0].quantity };

  const current = await currentQuantity(stockId);
  return current === null ? { ok: false, reason: "missing" } : { ok: false, reason: "conflict", current };
}

/**
 * Adds `delta` (negative to remove) in one statement, so concurrent sales are
 * never lost. Refused if the result would leave 0…MAX_STOCK.
 */
export async function adjustStock(stockId: number, delta: number): Promise<StockWriteResult> {
  const updated = await db
    .update(productStock)
    .set({ quantity: sql`${productStock.quantity} + ${delta}` })
    .where(
      and(
        eq(productStock.id, stockId),
        sql`${productStock.quantity} + ${delta} BETWEEN 0 AND ${MAX_STOCK}`,
      ),
    )
    .returning({ quantity: productStock.quantity });
  if (updated.length > 0) return { ok: true, quantity: updated[0].quantity };

  const current = await currentQuantity(stockId);
  if (current === null) return { ok: false, reason: "missing" };
  return { ok: false, reason: current + delta < 0 ? "below-zero" : "above-max", current };
}

/** Postgres error code for the guard below (division by zero). */
export const SIZE_HELD_ERROR = "22012";

/**
 * Statements that delete size rows, for use INSIDE a db.batch (one
 * transaction). Two statements so a checkout can't slip in between:
 *  1. Lock the rows. Waits for any checkout already reserving them to commit;
 *     a checkout that starts later blocks on the lock and then finds the row
 *     gone (reserveOrder's row count fails, so it reports a stock conflict).
 *  2. Delete only rows no pending/processing order holds. As a new statement
 *     it sees orders committed while step 1 waited. If any row was held, it
 *     divides by zero (SIZE_HELD_ERROR) and the whole batch rolls back.
 * Releases find stock rows by size name, so a held size must not disappear.
 */
export function deleteUnheldSizesStatements(stockIds: number[]) {
  const ids = sql.join(
    stockIds.map((id) => sql`${id}::int`),
    sql`, `,
  );
  return [
    db.execute(sql`UPDATE ${productStock} SET quantity = quantity WHERE id IN (${ids})`),
    db.execute(sql`
      WITH gone AS (
        DELETE FROM ${productStock} AS s
        WHERE s.id IN (${ids})
          AND NOT EXISTS (
            SELECT 1 FROM ${orderItems} i
            JOIN ${orders} o ON o.id = i.order_id
            WHERE i.product_id = s.product_id
              AND i.size_label = s.size_label
              AND o.payment_status IN ('pending', 'processing')
          )
        RETURNING s.id
      )
      SELECT 1 / (CASE WHEN (SELECT count(*) FROM gone) = ${stockIds.length} THEN 1 ELSE 0 END) AS ok
    `),
  ] as const;
}

/** Key for heldUnits: one product size. */
export const sizeKey = (productId: number, sizeLabel: string) => `${productId}:${sizeLabel}`;

/**
 * Units held by unpaid checkouts (pending or processing orders), per product
 * size. Already subtracted from quantity; shown for information, and used to
 * stop admins removing a size an order still needs to release into.
 */
export async function heldUnits(productIds: number[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await db
    .select({
      productId: orderItems.productId,
      sizeLabel: orderItems.sizeLabel,
      held: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        inArray(orderItems.productId, [...new Set(productIds)]),
        inArray(orders.paymentStatus, ["pending", "processing"]),
      ),
    )
    .groupBy(orderItems.productId, orderItems.sizeLabel);
  return new Map(rows.map((r) => [sizeKey(r.productId, r.sizeLabel), r.held]));
}
