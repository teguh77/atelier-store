import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/session";

/*
 * Order history for the signed-in customer. Read-only and never cached.
 *
 * Ownership is enforced here, not by callers: the functions that return
 * order data read the session themselves and filter on its user id in SQL.
 * There is no way to ask for another customer's order; it simply isn't found.
 *
 * Only checkouts the customer completed on Stripe are listed (Stripe reported
 * an amount): paid, processing, or failed after processing. Open or abandoned
 * checkouts (pending, expired) and sessions that never started aren't orders
 * from the customer's point of view.
 */

const placed = (userId: string) => and(eq(orders.userId, userId), isNotNull(orders.amountTotalCents));

/** Order numbers are positive Postgres integers. Anything else is null. */
export function parseOrderNumber(value: string) {
  if (!/^\d{1,10}$/.test(value)) return null;
  const n = Number(value);
  return n > 0 && n <= 2_147_483_647 ? n : null;
}

/** The signed-in customer's orders, newest first, with an item count and the first item's photo. */
export async function listMyOrders() {
  const { user } = await requireUser("/account/orders");
  const rows = await db.query.orders.findMany({
    where: placed(user.id),
    orderBy: [desc(orders.createdAt)],
    columns: { number: true, paymentStatus: true, createdAt: true, amountTotalCents: true, subtotalCents: true },
    with: {
      items: {
        orderBy: (i, { asc }) => [asc(i.id)],
        columns: { quantity: true },
        with: { product: { columns: { imageSrc: true, imagePosition: true } } },
      },
    },
  });
  return rows.map(({ items, ...order }) => ({
    ...order,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    image: items[0]?.product ?? null,
  }));
}

export type CustomerOrderSummary = Awaited<ReturnType<typeof listMyOrders>>[number];

/** One of the signed-in customer's orders by its number, or undefined if it isn't theirs. */
export async function getMyOrder(orderNumber: number) {
  const { user } = await requireUser(`/account/orders/${orderNumber}`);
  return db.query.orders.findFirst({
    where: and(placed(user.id), eq(orders.number, orderNumber)),
    with: {
      items: {
        orderBy: (i, { asc }) => [asc(i.id)],
        with: { product: { columns: { imageSrc: true, imagePosition: true } } },
      },
    },
  });
}

export type CustomerOrder = NonNullable<Awaited<ReturnType<typeof getMyOrder>>>;

/**
 * For the proxy only (it has the session but can't use requireUser). Returns
 * a yes/no, never order data, so it lets the proxy send a real 404 status.
 */
export async function customerHasOrder(userId: string, orderNumber: number) {
  const row = await db.query.orders.findFirst({
    where: and(placed(userId), eq(orders.number, orderNumber)),
    columns: { id: true },
  });
  return Boolean(row);
}
