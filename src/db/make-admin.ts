/*
 * Gives admin access to an existing account: `pnpm db:make-admin <email>`.
 * Sign up first, then run this. Like seed.ts, it builds its own client, so it
 * doesn't load src/lib/env.ts.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import { user } from "./schema";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.example.");
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: pnpm db:make-admin <email>");
  process.exit(1);
}

const db = drizzle({ client: neon(process.env.DATABASE_URL) });

async function makeAdmin() {
  const updated = await db
    .update(user)
    .set({ role: "admin" })
    .where(sql`lower(${user.email}) = ${email}`)
    .returning({ email: user.email });

  if (updated.length === 0) {
    console.error(`No account with the email ${email}. Sign up first.`);
    process.exit(1);
  }
  console.log(`${updated[0].email} is now an admin.`);
}

makeAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
