import { NO_DATABASE_URL, resolveTestDatabase } from "./test-database";

/*
 * Runs before every test file. Sets the env that src/lib/env.ts validates,
 * and ALWAYS overrides DATABASE_URL: either the guarded test branch or an
 * address that can't connect. Tests never see the app's real database.
 */

// The shell's DATABASE_URL (if any) is the app's: remember it for the guard
// before overriding it. Kept across test files that share this process.
process.env.APP_DATABASE_URL ??= process.env.DATABASE_URL ?? "";

const testDb = resolveTestDatabase();

process.env.DATABASE_URL = testDb.url ?? NO_DATABASE_URL;
process.env.TEST_DB_ENABLED = testDb.url ? "1" : "";
process.env.BETTER_AUTH_SECRET ??= "test-only-secret-not-used-for-anything-real-0000";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
Object.assign(process.env, { NODE_ENV: "test" });

if (testDb.url === null && !process.env.TEST_DB_NOTICE_SHOWN) {
  process.env.TEST_DB_NOTICE_SHOWN = "1";
  console.warn(`[test] Database tests skipped: ${testDb.reason}`);
}
