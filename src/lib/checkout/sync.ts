import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";

import { stockChanged } from "./cache";

import {
  endOrderAndRelease,
  findOrderById,
  markPaid,
  holdForReview,
  markProcessing,
  recordEvent,
  type EventRef,
  type PaymentDetails,
} from "./orders";

/*
 * Applies Stripe's record of a Checkout Session to our order. This is the
 * ONLY code that marks an order paid. Callers pass a session they fetched
 * from Stripe's API with our secret key (webhook handler, abandon/sweep),
 * never anything the browser sent.
 */

export type SyncResult = "paid" | "processing" | "expired" | "failed" | "unchanged" | "ignored";

function orderIdOf(session: Stripe.Checkout.Session) {
  return session.metadata?.order_id ?? session.client_reference_id ?? null;
}

function paymentDetails(session: Stripe.Checkout.Session): PaymentDetails {
  const shipping = session.collected_information?.shipping_details ?? null;
  const pi = session.payment_intent;
  return {
    amountTotalCents: session.amount_total,
    stripePaymentIntentId: typeof pi === "string" ? pi : (pi?.id ?? null),
    email: session.customer_details?.email ?? null,
    shippingName: shipping?.name ?? null,
    shippingAddress: shipping
      ? {
          line1: shipping.address.line1,
          line2: shipping.address.line2,
          city: shipping.address.city,
          state: shipping.address.state,
          postalCode: shipping.address.postal_code,
          country: shipping.address.country,
        }
      : null,
  };
}

/** Loads the order a session belongs to, or null if it isn't one of ours. */
async function orderFor(session: Stripe.Checkout.Session) {
  const orderId = orderIdOf(session);
  if (!orderId) return null;
  const order = await findOrderById(orderId).catch(() => null);
  if (!order) return null;
  // A different session already belongs to this order: ignore the stray one.
  if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) return null;
  return order;
}

/**
 * Moves the order to match the session:
 * - complete + paid (or no payment required) → paid
 * - complete + unpaid (delayed method)       → processing
 * - expired                                  → expired, stock returned
 * - open                                     → unchanged
 */
export async function applyCheckoutSession(
  session: Stripe.Checkout.Session,
  event?: EventRef,
): Promise<SyncResult> {
  const order = await orderFor(session);
  if (!order) {
    if (event) await recordEvent(event);
    return "ignored";
  }

  if (session.status === "expired") {
    await endOrderAndRelease(order.id, "expired", event);
    stockChanged();
    return "expired";
  }

  if (session.status === "complete") {
    // Stripe must have charged exactly what we computed from our database.
    if (session.currency !== order.currency || session.amount_subtotal !== order.subtotalCents) {
      console.error(
        `[checkout] Amount mismatch for order ${order.id}: expected ${order.subtotalCents} ${order.currency}, ` +
          `Stripe reports ${session.amount_subtotal} ${session.currency}. Not marking paid; held for manual review.`,
      );
      // Out of the stale sweep, stock still held (see holdForReview).
      await holdForReview(order.id, event);
      return "unchanged";
    }

    const details = paymentDetails(session);
    const charged = session.payment_status === "paid" || session.payment_status === "no_payment_required";

    // Stripe took the money but our order already ended and its stock went
    // back. The conditional update below would silently do nothing, so flag it.
    if (charged && (order.paymentStatus === "failed" || order.paymentStatus === "expired")) {
      console.error(
        `[checkout] Order ${order.id} is ${order.paymentStatus} but Stripe session ${session.id} is paid. ` +
          `Not changing it; refund or fulfil manually.`,
      );
      if (event) await recordEvent(event);
      return "unchanged";
    }

    if (charged) {
      await markPaid(order.id, details, event);
      return "paid";
    }
    await markProcessing(order.id, details, event);
    return "processing";
  }

  if (event) await recordEvent(event);
  return "unchanged";
}

/** A delayed payment failed after checkout: fail the order and return stock. */
export async function failCheckoutSession(session: Stripe.Checkout.Session, event?: EventRef) {
  const order = await orderFor(session);
  if (!order) {
    if (event) await recordEvent(event);
    return "ignored" as const;
  }
  await endOrderAndRelease(order.id, "failed", event);
  stockChanged();
  return "failed" as const;
}

/** Fetches the session from Stripe (never trust a payload's copy) and applies it. */
export async function syncSessionFromStripe(sessionId: string, event?: EventRef) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  return applyCheckoutSession(session, event);
}

/**
 * Ends a pending order's checkout early (customer canceled, or a stale hold):
 * expires the Stripe session, then applies what Stripe reports. If the
 * customer paid in the meantime, expire fails and the order is marked paid
 * instead, so a completed payment is never thrown away.
 */
export async function expirePendingOrder(orderId: string) {
  const order = await findOrderById(orderId);
  if (!order || order.paymentStatus !== "pending") return;

  if (!order.stripeCheckoutSessionId) {
    // The Stripe session was never created; nothing can be paid.
    await endOrderAndRelease(order.id, "failed");
    stockChanged();
    return;
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
  } catch {
    // Already expired or completed: read its real state instead.
    session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
  }
  await applyCheckoutSession(session);
}
