"use server";

import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { z } from "zod";

import { buildCart } from "@/lib/cart/build";
import { readCartCookie, writeCartCookie } from "@/lib/cart/cookie";
import { getLiveProducts } from "@/lib/cart/queries";
import { env } from "@/lib/env";
import { ONE_SIZE } from "@/lib/products";
import { getSession } from "@/lib/session";
import { CHECKOUT_INTEGRATION_ID, getStripe, isStripeConfigured } from "@/lib/stripe";

import { stockChanged } from "./cache";
import { clearCheckoutCookie, readCheckoutCookie, setCheckoutCookie } from "./cookie";
import {
  attachCheckoutSession,
  endOrderAndRelease,
  findOrderBySessionId,
  findStalePendingOrders,
  reserveOrder,
  StockConflictError,
  type ReservedLine,
} from "./orders";
import { expirePendingOrder } from "./sync";

/*
 * Checkout actions. The browser sends nothing about prices or payment:
 * the cart comes from the httpOnly cookie, prices and stock from Postgres,
 * and payment status from Stripe (see sync.ts and the webhook).
 */

export type CheckoutState = { error: string | null };

/** Stripe needs expires_at at least 30 minutes ahead; a little margin avoids edge rejects. */
const HOLD_MS = 30 * 60 * 1000 + 60 * 1000;

function siteUrl() {
  return (env.NEXT_PUBLIC_APP_URL ?? env.BETTER_AUTH_URL).replace(/\/$/, "");
}

/** Releases holds whose webhook never arrived. Bounded so checkout stays fast. */
async function sweepStaleReservations() {
  const stale = await findStalePendingOrders(5);
  for (const order of stale) {
    await expirePendingOrder(order.id).catch((error) =>
      console.error(`[checkout] Couldn't release stale order ${order.id}:`, (error as Error).message),
    );
  }
}

/** Takes no input: everything comes from the cookie, the database and Stripe. */
export async function startCheckout(): Promise<CheckoutState> {
  let result: CheckoutState & { url?: string };
  try {
    result = await prepareCheckout();
  } catch (error) {
    // e.g. the database or Stripe is unreachable. Show a message, not an error page.
    console.error("[checkout] Couldn't start checkout:", (error as Error).message);
    return { error: "We couldn't start checkout. Please try again in a moment." };
  }
  // Outside the try: redirect() works by throwing.
  if (result.url) redirect(result.url);
  return { error: result.error };
}

async function prepareCheckout(): Promise<CheckoutState & { url?: string }> {
  if (!isStripeConfigured()) {
    return { error: "Checkout isn't available right now. Please try again later." };
  }

  // 1. Re-check the bag against live stock and prices.
  const stored = await readCartCookie();
  if (stored.length === 0) return { error: "Your bag is empty." };
  const live = await getLiveProducts(stored.map((l) => l.slug));
  const { cart, corrected } = buildCart(stored, live);
  if (cart.removedCount > 0 || cart.lines.some((l) => l.status !== "ok")) {
    await writeCartCookie(corrected);
    return { error: "Your bag changed since you last looked. Review it, then check out again." };
  }

  // 2. A previous checkout from this browser gives its stock back first.
  const previous = await readCheckoutCookie();
  if (previous) await expirePendingOrder(previous).catch(() => undefined);
  await sweepStaleReservations().catch(() => undefined);

  // 3. Reserve stock and create the pending order in one transaction.
  const session = await getSession();
  const orderId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_MS);
  const lines: ReservedLine[] = cart.lines.map((line) => {
    const product = live.get(line.slug)!;
    return {
      productId: product.id,
      stockId: product.stockIds.get(line.size)!,
      slug: line.slug,
      name: product.name,
      size: line.size,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
    };
  });

  try {
    await reserveOrder({
      orderId,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      lines,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof StockConflictError) {
      return { error: "Some items sold out while you were checking out. Review your bag and try again." };
    }
    throw error;
  }
  stockChanged();

  // 4. Create the Stripe session from the same database rows.
  let checkoutUrl: string;
  let created: Stripe.Checkout.Session | null = null;
  try {
    created = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: lines.map((l) => {
          const image = live.get(l.slug)?.image.src;
          return {
            quantity: l.quantity,
            price_data: {
              currency: "usd",
              unit_amount: l.unitPriceCents,
              product_data: {
                name: l.name,
                ...(l.size !== ONE_SIZE && { description: `Size ${l.size}` }),
                ...(image && { images: [image] }),
                metadata: { product_id: String(l.productId), size: l.size },
              },
            },
          };
        }),
        client_reference_id: orderId,
        metadata: { order_id: orderId },
        payment_intent_data: { metadata: { order_id: orderId } },
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        ...(session?.user.email && { customer_email: session.user.email }),
        shipping_address_collection: { allowed_countries: ["US"] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Complimentary shipping",
            },
          },
        ],
        success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/bag?checkout=canceled`,
        integration_identifier: CHECKOUT_INTEGRATION_ID,
      },
      { idempotencyKey: `checkout-${orderId}` },
    );
    if (!created.url) throw new Error("Stripe returned a session without a URL.");
    await attachCheckoutSession(orderId, created.id);
    checkoutUrl = created.url;
  } catch (error) {
    console.error(`[checkout] Couldn't start Stripe checkout for order ${orderId}:`, (error as Error).message);
    // Make sure the session can't be paid, then return the stock.
    if (created) await getStripe().checkout.sessions.expire(created.id).catch(() => undefined);
    await endOrderAndRelease(orderId, "failed");
    stockChanged();
    return { error: "We couldn't start checkout. Please try again." };
  }

  // 5. Remember this checkout in this browser, then hand over to Stripe.
  await setCheckoutCookie(orderId);
  return { error: null, url: checkoutUrl };
}

/**
 * The customer came back from Stripe without paying. Expire their session
 * now so the stock returns immediately. The bag stays as it was.
 */
export async function abandonCheckout(): Promise<void> {
  const orderId = await readCheckoutCookie();
  if (!orderId || !isStripeConfigured()) return;
  await expirePendingOrder(orderId).catch((error) =>
    console.error(`[checkout] Couldn't expire order ${orderId}:`, (error as Error).message),
  );
  await clearCheckoutCookie();
}

const sessionIdSchema = z.string().regex(/^cs_[A-Za-z0-9_]+$/).max(300);

/**
 * Empties the bag after a successful checkout. Only when this browser
 * started that order, and only once Stripe has confirmed it (the webhook
 * set it to paid or processing). It never changes the order itself.
 */
export async function clearCartAfterPayment(sessionId: string): Promise<boolean> {
  const parsed = sessionIdSchema.safeParse(sessionId);
  const orderId = await readCheckoutCookie();
  if (!parsed.success || !orderId) return false;

  const order = await findOrderBySessionId(parsed.data);
  if (!order || order.id !== orderId) return false;
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "processing") return false;

  await writeCartCookie([]);
  await clearCheckoutCookie();
  return true;
}
