import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products } from "./products";

/*
 * Orders for Stripe Checkout. Money is integer cents.
 *
 * Payment status changes only on the server, from Stripe's own record of the
 * Checkout Session (webhook or a server-side retrieve), never from the client:
 *
 *   pending ──▶ paid
 *   pending ──▶ processing ──▶ paid | failed     (delayed payment methods)
 *   pending ──▶ expired | failed                 (stock is put back)
 *
 * Stock is taken from product_stock when the order is created (pending) and
 * returned when it ends as expired or failed.
 */

export const paymentStatus = pgEnum("payment_status", [
  /** Stock reserved, Stripe session open (or about to be created). */
  "pending",
  /** Checkout completed; a delayed payment (e.g. bank debit) hasn't cleared yet. */
  "processing",
  /** Stripe confirmed the payment. */
  "paid",
  /** Payment failed, or the Stripe session couldn't be created. */
  "failed",
  /** The session expired or was abandoned before payment. */
  "expired",
]);

/** Shipping address as reported by Stripe Checkout. */
export type ShippingAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Customer-facing number, shown as AT-000123. */
    number: serial("number").notNull().unique(),
    /** Signed-in customer. Null for guest checkout, or if the account is deleted. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** From the account at checkout, then from Stripe once the customer enters it. */
    email: text("email"),

    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    currency: text("currency").notNull().default("usd"),
    /** Our total from database prices when the order was created. */
    subtotalCents: integer("subtotal_cents").notNull(),
    /** What Stripe reports it charged. Null until the session completes. */
    amountTotalCents: integer("amount_total_cents"),

    /** Null only between creating the order and creating its Stripe session. */
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    /** Set when the session completes. */
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),

    /** When the stock hold ends (the Stripe session's expires_at). */
    reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true }).notNull(),
    shippingName: text("shipping_name"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("orders_subtotal_cents_check", sql`${t.subtotalCents} >= 0`),
    check("orders_amount_total_cents_check", sql`${t.amountTotalCents} >= 0`),
    check("orders_currency_check", sql`${t.currency} ~ '^[a-z]{3}$'`),
    // A paid order always records when, and which Stripe session paid it.
    check(
      "orders_paid_fields_check",
      sql`${t.paymentStatus} <> 'paid' OR (${t.paidAt} IS NOT NULL AND ${t.stripeCheckoutSessionId} IS NOT NULL)`,
    ),
    // Only a completed Stripe session can move an order to processing.
    check(
      "orders_processing_session_check",
      sql`${t.paymentStatus} <> 'processing' OR ${t.stripeCheckoutSessionId} IS NOT NULL`,
    ),
    index("orders_user_id_idx").on(t.userId),
    // Finds pending orders whose stock hold has run out.
    index("orders_status_reservation_idx").on(t.paymentStatus, t.reservationExpiresAt),
  ],
);

/** One line per product and size, with name and price copied at checkout. */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    sizeLabel: text("size_label").notNull(),
    quantity: integer("quantity").notNull(),
    // Snapshot: later product edits don't change past orders.
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [
    unique("order_items_order_product_size_unique").on(t.orderId, t.productId, t.sizeLabel),
    check("order_items_quantity_check", sql`${t.quantity} > 0`),
    check("order_items_unit_price_cents_check", sql`${t.unitPriceCents} >= 0`),
    check(
      "order_items_line_total_check",
      sql`${t.lineTotalCents} = ${t.unitPriceCents} * ${t.quantity}`,
    ),
    index("order_items_product_id_idx").on(t.productId),
  ],
);

/** Stripe webhook events already applied. A repeat delivery is skipped. */
export const stripeEvents = pgTable("stripe_events", {
  /** Stripe event id (evt_…). */
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
