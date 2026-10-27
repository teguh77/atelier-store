import { and, eq, inArray, lt, sql, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { db } from "@/db";
import { orderItems, orders, productStock, products, stripeEvents, type ShippingAddress } from "@/db/schema";

/*
 * Order writes for checkout. Every multi-step write goes through db.batch,
 * which the Neon HTTP driver runs as ONE transaction: it all applies or none
 * of it does.
 *
 * Payment status only moves forward. Each change is a conditional update
 * ("… WHERE payment_status IN (allowed states)"), so repeating it is a no-op,
 * and stock is put back only when the order actually changed state.
 */

export type OrderStatus = (typeof orders.$inferSelect)["paymentStatus"];

/** A Stripe event to record alongside an order change (webhook path only). */
export type EventRef = { id: string; type: string };

export type ReservedLine = {
  productId: number;
  stockId: number;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
};

/** Stock changed between the bag check and the reservation. Nothing was written. */
export class StockConflictError extends Error {
  constructor() {
    super("Stock changed while reserving the order.");
  }
}

type Batch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

function recordEventStatement(event: EventRef) {
  return db.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing();
}

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

/**
 * Takes the stock and creates the pending order with its items, atomically.
 * Throws StockConflictError if any size no longer has enough stock (the
 * product_stock quantity >= 0 check fails) or a stock row is gone.
 */
export async function reserveOrder(input: {
  orderId: string;
  userId: string | null;
  email: string | null;
  lines: ReservedLine[];
  expiresAt: Date;
}) {
  const { orderId, lines } = input;
  const subtotal = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const wanted = sql.join(
    lines.map((l) => sql`(${l.stockId}::int, ${l.quantity}::int)`),
    sql`, `,
  );

  try {
    await db.batch([
      // One statement: decrement every line. Going below zero violates the
      // CHECK constraint, and a missing row makes the count differ, which
      // divides by zero. Either error rolls back the whole batch.
      db.execute(sql`
        WITH wanted(stock_id, qty) AS (VALUES ${wanted}),
        taken AS (
          UPDATE ${productStock} AS s
          SET quantity = s.quantity - w.qty
          FROM wanted w
          WHERE s.id = w.stock_id
            -- A product hidden since the bag check counts as missing.
            AND EXISTS (SELECT 1 FROM ${products} p WHERE p.id = s.product_id AND p.is_active)
          RETURNING s.id
        )
        SELECT 1 / (CASE WHEN (SELECT count(*) FROM taken) = ${lines.length} THEN 1 ELSE 0 END) AS ok
      `),
      db.insert(orders).values({
        id: orderId,
        userId: input.userId,
        email: input.email,
        subtotalCents: subtotal,
        reservationExpiresAt: input.expiresAt,
      }),
      db.insert(orderItems).values(
        lines.map((l) => ({
          orderId,
          productId: l.productId,
          sizeLabel: l.size,
          quantity: l.quantity,
          productSlug: l.slug,
          productName: l.name,
          unitPriceCents: l.unitPriceCents,
          lineTotalCents: l.unitPriceCents * l.quantity,
        })),
      ),
    ]);
  } catch (error) {
    // 23514: check violation (stock would go negative). 22012: a stock row is missing.
    const code = pgCode(error);
    if (code === "23514" || code === "22012") throw new StockConflictError();
    throw error;
  }
  return { subtotalCents: subtotal };
}

/** Links the Stripe session to a pending order. */
export async function attachCheckoutSession(orderId: string, sessionId: string) {
  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId })
    .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "pending")));
}

/**
 * Ends an order without payment and returns its stock, in one statement.
 * expired: from pending. failed: from pending or processing.
 * Stock is only returned if the status actually changed.
 */
export async function endOrderAndRelease(
  orderId: string,
  to: "expired" | "failed",
  event?: EventRef,
) {
  const from: OrderStatus[] = to === "expired" ? ["pending"] : ["pending", "processing"];
  const fromList = sql.join(
    from.map((s) => sql`${s}::payment_status`),
    sql`, `,
  );

  const statements: Batch = [
    db.execute(sql`
      WITH changed AS (
        UPDATE ${orders}
        SET payment_status = ${to}::payment_status, updated_at = now()
        WHERE id = ${orderId} AND payment_status IN (${fromList})
        RETURNING id
      )
      UPDATE ${productStock} AS s
      SET quantity = s.quantity + i.quantity
      FROM ${orderItems} AS i
      JOIN changed c ON c.id = i.order_id
      WHERE s.product_id = i.product_id AND s.size_label = i.size_label
    `),
  ];
  if (event) statements.push(recordEventStatement(event));
  await db.batch(statements);
}

export type PaymentDetails = {
  amountTotalCents: number | null;
  stripePaymentIntentId: string | null;
  email: string | null;
  shippingName: string | null;
  shippingAddress: ShippingAddress | null;
};

/** pending|processing → paid. Only called with Stripe's own record of the session. */
export async function markPaid(orderId: string, details: PaymentDetails, event?: EventRef) {
  await applyCompletion(orderId, "paid", ["pending", "processing"], details, event);
}

/** pending → processing (checkout done, delayed payment not cleared yet). */
export async function markProcessing(orderId: string, details: PaymentDetails, event?: EventRef) {
  await applyCompletion(orderId, "processing", ["pending"], details, event);
}

async function applyCompletion(
  orderId: string,
  to: "paid" | "processing",
  from: OrderStatus[],
  details: PaymentDetails,
  event?: EventRef,
) {
  const statements: Batch = [
    db
      .update(orders)
      .set({
        paymentStatus: to,
        paidAt: to === "paid" ? new Date() : undefined,
        amountTotalCents: details.amountTotalCents,
        stripePaymentIntentId: details.stripePaymentIntentId,
        // Keep the account email when Stripe doesn't report one.
        email: details.email ?? undefined,
        shippingName: details.shippingName,
        shippingAddress: details.shippingAddress,
      })
      .where(and(eq(orders.id, orderId), inArray(orders.paymentStatus, from))),
  ];
  if (event) statements.push(recordEventStatement(event));
  await db.batch(statements);
}

/**
 * Stripe's amount didn't match our order: never mark it paid automatically.
 * Keeps the stock held (the customer may have been charged) and moves the
 * hold far into the future, so the stale-order sweep stops retrying it on
 * every checkout. Resolve by hand from the logged details. Pending only.
 */
export const REVIEW_HOLD_UNTIL = new Date("9999-12-31T00:00:00Z");

export async function holdForReview(orderId: string, event?: EventRef) {
  const statements: Batch = [
    db
      .update(orders)
      .set({ reservationExpiresAt: REVIEW_HOLD_UNTIL })
      .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "pending"))),
  ];
  if (event) statements.push(recordEventStatement(event));
  await db.batch(statements);
}

/** Records an event that needed no order change, so a repeat is skipped. */
export async function recordEvent(event: EventRef) {
  await recordEventStatement(event);
}

export async function isEventProcessed(eventId: string) {
  const row = await db.query.stripeEvents.findFirst({ where: eq(stripeEvents.id, eventId) });
  return Boolean(row);
}

export async function findOrderById(orderId: string) {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) });
}

/** The order (with items and each item's current photo) for a Stripe session id. Read-only. */
export async function findOrderBySessionId(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeCheckoutSessionId, sessionId),
    with: {
      items: {
        orderBy: (i, { asc }) => [asc(i.id)],
        with: { product: { columns: { imageSrc: true, imagePosition: true } } },
      },
    },
  });
}

export type ConfirmationOrder = NonNullable<Awaited<ReturnType<typeof findOrderBySessionId>>>;

/** Pending orders whose stock hold ended over an hour ago (webhook likely missed). */
export async function findStalePendingOrders(limit = 5) {
  const cutoff: SQL = sql`now() - interval '1 hour'`;
  return db.query.orders.findMany({
    where: and(eq(orders.paymentStatus, "pending"), lt(orders.reservationExpiresAt, cutoff)),
    limit,
  });
}
