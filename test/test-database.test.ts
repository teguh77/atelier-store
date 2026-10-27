import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveTestDatabase } from "./test-database";

/** A throwaway project folder with the given env files. */
function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "atelier-guard-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

const APP = "postgresql://u:p@ep-app-123.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const TEST = "postgresql://u:p@ep-test-456.eu-central-1.aws.neon.tech/neondb?sslmode=require";

describe("test database guard", () => {
  it("is off when no test URL is configured", () => {
    const result = resolveTestDatabase(project({ ".env.local": `DATABASE_URL=${APP}` }), {});
    expect(result.url).toBeNull();
  });

  it("refuses the app's own database, even with different query params", () => {
    const dir = project({ ".env.local": `DATABASE_URL=${APP}`, ".env.test": `TEST_DATABASE_URL=${APP.replace("?sslmode=require", "")}` });
    expect(resolveTestDatabase(dir, {})).toMatchObject({ url: null, reason: expect.stringMatching(/app's database/) });
  });

  it("refuses the app's database passed through the environment", () => {
    const dir = project({ ".env.local": `DATABASE_URL=${APP}` });
    expect(resolveTestDatabase(dir, { TEST_DATABASE_URL: APP }).url).toBeNull();
  });

  it("refuses the app's database through Neon's pooled host (and the reverse)", () => {
    const pooled = APP.replace("ep-app-123.", "ep-app-123-pooler.");
    const viaPooler = project({ ".env.local": `DATABASE_URL=${APP}`, ".env.test": `TEST_DATABASE_URL=${pooled}` });
    expect(resolveTestDatabase(viaPooler, {}).url).toBeNull();
    const appPooled = project({ ".env.local": `DATABASE_URL=${pooled}`, ".env.test": `TEST_DATABASE_URL=${APP}` });
    expect(resolveTestDatabase(appPooled, {}).url).toBeNull();
  });

  it("refuses the database set as DATABASE_URL in the shell", () => {
    const dir = project({ ".env.test": `TEST_DATABASE_URL=${TEST}` });
    expect(resolveTestDatabase(dir, { DATABASE_URL: TEST }).url).toBeNull();
    // After test/setup.ts overrides DATABASE_URL, the shell's value is kept in APP_DATABASE_URL.
    expect(resolveTestDatabase(dir, { APP_DATABASE_URL: TEST, DATABASE_URL: "postgresql://x@other/db" }).url).toBeNull();
  });

  it("accepts a separate branch", () => {
    const dir = project({ ".env.local": `DATABASE_URL=${APP}`, ".env.test": `TEST_DATABASE_URL=${TEST}` });
    expect(resolveTestDatabase(dir, {})).toEqual({ url: TEST });
  });

  it("refuses an invalid URL", () => {
    expect(resolveTestDatabase(project({}), { TEST_DATABASE_URL: "not a url" }).url).toBeNull();
  });
});

describe("test setup", () => {
  it("never leaves the app's database configured for tests", () => {
    // test/setup.ts ran before this file.
    expect(process.env.DATABASE_URL).toMatch(process.env.TEST_DB_ENABLED === "1" ? /^postgres/ : /no-test-database\.invalid/);
  });
});
