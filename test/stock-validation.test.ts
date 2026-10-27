import { describe, expect, it } from "vitest";

import { adjustmentSchema, quantitySchema, sizeRemovalError } from "@/lib/admin/schemas";

describe("quantitySchema (Set to)", () => {
  it.each([
    ["0", 0],
    ["7", 7],
    [" 12 ", 12],
    ["9999", 9999],
  ])("accepts %j", (input, expected) => {
    expect(quantitySchema.parse(input)).toBe(expected);
  });

  it.each(["", "  ", "-1", "10000", "1.5", "1e3", "abc", "+3"])("rejects %j", (input) => {
    expect(quantitySchema.safeParse(input).success).toBe(false);
  });

  it("rejects a missing field", () => {
    expect(quantitySchema.safeParse(null).success).toBe(false);
  });
});

describe("adjustmentSchema (Adjust by)", () => {
  it.each([
    ["+5", 5],
    ["5", 5],
    ["-2", -2],
    [" +9999 ", 9999],
    ["-9999", -9999],
  ])("accepts %j", (input, expected) => {
    expect(adjustmentSchema.parse(input)).toBe(expected);
  });

  it.each(["0", "+0", "-0", "", "1.5", "abc", "++1", "10000", "-10000", "5-"])("rejects %j", (input) => {
    expect(adjustmentSchema.safeParse(input).success).toBe(false);
  });
});

describe("sizeRemovalError", () => {
  const held = new Map([
    ["M", 2],
    ["L", 0],
  ]);

  it("allows removing sizes no checkout holds", () => {
    expect(sizeRemovalError(["L", "XL"], held)).toBeNull();
    expect(sizeRemovalError([], held)).toBeNull();
  });

  it("blocks a held size and says how many units", () => {
    expect(sizeRemovalError(["M", "L"], held)).toMatch(/M \(2 units\)/);
  });
});
