import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "dotenv";

/*
 * Database tests run ONLY against a separate Neon branch, never the app's
 * database. Put its URL in .env.test (gitignored):
 *
 *   TEST_DATABASE_URL=postgresql://…@ep-…-test….neon.tech/neondb?sslmode=require
 *
 * Create one with the Neon console or `neonctl branches create --name test`.
 * The guard refuses a URL that reaches the app's database: DATABASE_URL in
 * .env.local or .env, or DATABASE_URL set in the shell (recorded by
 * test/setup.ts as APP_DATABASE_URL before it overrides DATABASE_URL).
 */

function readEnvFile(path: string): Record<string, string> {
  return existsSync(path) ? parse(readFileSync(path)) : {};
}

/**
 * The database a URL reaches, as a comparable host. Neon serves one endpoint
 * on two hosts: ep-x.region… (direct) and ep-x-pooler.region… (pooled), so
 * "-pooler" is removed from the first label before comparing.
 */
function host(url: string | undefined) {
  if (!url) return null;
  try {
    const [first, ...rest] = new URL(url).hostname.toLowerCase().split(".");
    return [first.replace(/-pooler$/, ""), ...rest].join(".");
  } catch {
    return null;
  }
}

export type TestDatabase = { url: string } | { url: null; reason: string };

/** `dir` is the project root (overridable so the guard itself can be tested). */
export function resolveTestDatabase(dir = ".", env: Record<string, string | undefined> = process.env): TestDatabase {
  const url = env.TEST_DATABASE_URL ?? readEnvFile(join(dir, ".env.test")).TEST_DATABASE_URL;
  if (!url) return { url: null, reason: "TEST_DATABASE_URL is not set (see test/test-database.ts)." };

  const testHost = host(url);
  if (!testHost) return { url: null, reason: "TEST_DATABASE_URL isn't a valid URL." };

  const appHosts = [
    readEnvFile(join(dir, ".env.local")).DATABASE_URL,
    readEnvFile(join(dir, ".env")).DATABASE_URL,
    env.APP_DATABASE_URL ?? env.DATABASE_URL,
  ].map(host);
  if (appHosts.includes(testHost)) {
    return { url: null, reason: "TEST_DATABASE_URL points at the app's database. Use a separate Neon branch." };
  }
  return { url };
}

/** Never connects anywhere: used when no test database is configured. */
export const NO_DATABASE_URL = "postgresql://no-test-database.invalid/none";
