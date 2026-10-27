import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .refine((secret) => !secret.startsWith("replace-with"), {
      message: "BETTER_AUTH_SECRET is still the .env.example placeholder. Generate a real secret.",
    }),
  BETTER_AUTH_URL: z.url(),
  /** Public site origin for Stripe's return URLs. Falls back to BETTER_AUTH_URL. */
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  /*
   * Stripe. Optional so the rest of the site runs without them; checkout
   * reports itself unavailable until both are set. Prefer a restricted key
   * (rk_…) with Checkout Sessions write access.
   */
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^(rk|sk)_(test|live)_/, "STRIPE_SECRET_KEY must be a Stripe secret or restricted key.")
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must be a webhook signing secret (whsec_…).")
    .optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables. See .env.example.");
}

export const env = parsed.data;
