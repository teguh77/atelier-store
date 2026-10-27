import Stripe from "stripe";

import { env } from "@/lib/env";

/*
 * Server-only Stripe client. Created on first use so builds and pages that
 * never touch checkout work without keys. Never import this from client code.
 */

let client: Stripe | null = null;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe isn't configured. Set STRIPE_SECRET_KEY in .env.local.");
  }
}

/**
 * Checkout needs BOTH keys: the secret key to create sessions and the webhook
 * secret to confirm payments. With only the first, customers could pay but
 * the webhook would refuse every event and orders would stay pending.
 */
export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new StripeNotConfiguredError();
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
    appInfo: { name: "atelier-store" },
  });
  return client;
}

/** Tags our Checkout Sessions in the Dashboard (label + 8 random letters). */
export const CHECKOUT_INTEGRATION_ID = "atelier-checkout-qkzmwvta";
