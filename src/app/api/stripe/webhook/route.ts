import type Stripe from "stripe";

import { isEventProcessed } from "@/lib/checkout/orders";
import { failCheckoutSession, syncSessionFromStripe } from "@/lib/checkout/sync";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

/*
 * Stripe webhook. The main way orders reach paid, processing, failed or
 * expired.
 *
 * - The signature is checked on the raw body before anything else.
 * - Events already applied (stripe_events) are acknowledged and skipped.
 * - The session is re-fetched from Stripe so out-of-order or stale payloads
 *   can't move an order backwards.
 * - The order change and the event record commit in one transaction. Any
 *   error returns 500 so Stripe retries; nothing is half-applied.
 */

const SESSION_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export async function POST(request: Request) {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (!SESSION_EVENTS.has(event.type)) return Response.json({ received: true, ignored: true });

  const ref = { id: event.id, type: event.type };
  const session = event.data.object as Stripe.Checkout.Session;

  try {
    // Fast path for redelivery. Two copies arriving at once can both pass
    // this; that's safe because every order change is a conditional update.
    if (await isEventProcessed(event.id)) return Response.json({ received: true, duplicate: true });

    if (event.type === "checkout.session.async_payment_failed") {
      const fresh = await getStripe().checkout.sessions.retrieve(session.id);
      await failCheckoutSession(fresh, ref);
    } else {
      await syncSessionFromStripe(session.id, ref);
    }
  } catch (error) {
    console.error(`[stripe-webhook] ${event.type} ${event.id} failed:`, (error as Error).message);
    return Response.json({ error: "Processing failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
