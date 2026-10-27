import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const SESSION_DAYS = 30;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: SESSION_DAYS * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  user: {
    additionalFields: {
      // Set only on the server (see src/db/make-admin.ts). Clients can't send it.
      role: {
        type: "string",
        defaultValue: "customer",
        input: false,
      },
    },
  },
  // nextCookies must stay last in the plugins list.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
