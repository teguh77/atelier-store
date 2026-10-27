import { execFileSync } from "node:child_process";

import { resolveTestDatabase } from "./test-database";

/*
 * `pnpm test:db:prepare`: applies migrations and the seed to the TEST branch.
 * drizzle.config.ts and src/db/seed.ts load .env.local with dotenv, which
 * never overrides a variable already set, so DATABASE_URL below wins.
 */

const testDb = resolveTestDatabase();
if (testDb.url === null) {
  console.error(`Refusing to prepare: ${testDb.reason}`);
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testDb.url };
console.log(`Preparing test database on ${new URL(testDb.url).hostname}…`);
execFileSync("pnpm", ["exec", "drizzle-kit", "migrate"], { stdio: "inherit", env });
execFileSync("pnpm", ["exec", "tsx", "src/db/seed.ts"], { stdio: "inherit", env });
console.log("Test database ready.");
