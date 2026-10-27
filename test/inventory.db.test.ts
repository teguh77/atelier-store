import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

/*
 * Stock behaviour against a real Postgres: the TEST branch only (see
 * test/test-database.ts). Skipped when no test branch is configured.
 * Each run creates its own category and product and deletes them after.
 */

const enabled = process.env.TEST_DB_ENABLED === "1";

type Db = typeof import("@/db")["db"];
type Schema = typeof import("@/db/schema");
type Inventory = typeof import("@/lib/inventory");
type Orders = typeof import("@/lib/checkout/orders");

describe.skipIf(!enabled)("inventory (test database)", () => {
  // Loaded in beforeAll so nothing touches a database when the suite is skipped.
  let db: Db;
  let categories: Schema["categories"], orders: Schema["orders"];
  let productStock: Schema["productStock"], products: Schema["products"];
  let adjustStock: Inventory["adjustStock"], heldUnits: Inventory["heldUnits"];
  let setStock: Inventory["setStock"], sizeKey: Inventory["sizeKey"];
  let endOrderAndRelease: Orders["endOrderAndRelease"], reserveOrder: Orders["reserveOrder"];
  let StockConflictError: Orders["StockConflictError"];
  let holdForReview: Orders["holdForReview"], findStalePendingOrders: Orders["findStalePendingOrders"];
  let deleteUnheldSizesStatements: Inventory["deleteUnheldSizesStatements"];
  let SIZE_HELD_ERROR: Inventory["SIZE_HELD_ERROR"];

  const run = `vitest-${Date.now().toString(36)}`;
  let productId: number;
  let stockId: number;
  const orderIds: string[] = [];

  const quantity = async () =>
    (await db.query.productStock.findFirst({ where: eq(productStock.id, stockId) }))!.quantity;
  const setQuantity = (n: number) => db.update(productStock).set({ quantity: n }).where(eq(productStock.id, stockId));

  async function reserve(qty: number) {
    const orderId = crypto.randomUUID();
    orderIds.push(orderId);
    await reserveOrder({
      orderId,
      userId: null,
      email: null,
      expiresAt: new Date(Date.now() + 30 * 60_000),
      lines: [{ productId, stockId, slug: run, name: "Vitest product", size: "M", quantity: qty, unitPriceCents: 1000 }],
    });
    return orderId;
  }

  beforeAll(async () => {
    ({ db } = await import("@/db"));
    ({ categories, orders, productStock, products } = await import("@/db/schema"));
    ({ adjustStock, heldUnits, setStock, sizeKey, deleteUnheldSizesStatements, SIZE_HELD_ERROR } = await import(
      "@/lib/inventory"
    ));
    ({ endOrderAndRelease, reserveOrder, StockConflictError, holdForReview, findStalePendingOrders } = await import(
      "@/lib/checkout/orders"
    ));

    const [category] = await db
      .insert(categories)
      .values({ slug: run, label: "Vitest category", sortOrder: 999 })
      .returning({ id: categories.id });
    const [product] = await db
      .insert(products)
      .values({
        slug: run,
        sku: run.toUpperCase(),
        name: "Vitest product",
        description: "Created by test/inventory.db.test.ts",
        priceCents: 1000,
        colorName: "Test",
        colorHex: "#000000",
        imageSrc: "https://images.unsplash.com/photo-test",
        imageAlt: "Test",
        categoryId: category.id,
        isActive: true, // checkout (reserveOrder) refuses hidden products
      })
      .returning({ id: products.id });
    productId = product.id;
    const [stock] = await db
      .insert(productStock)
      .values({ productId, sizeLabel: "M", quantity: 10 })
      .returning({ id: productStock.id });
    stockId = stock.id;
  });

  afterAll(async () => {
    // Orders reference the product (restrict), so remove them first; items cascade.
    if (orderIds.length) await db.delete(orders).where(inArray(orders.id, orderIds));
    if (productId) await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.slug, run));
  });

  beforeEach(async () => {
    await setQuantity(10);
  });

  describe("setStock (compare-and-set)", () => {
    it("applies when stock still has the value the admin saw", async () => {
      expect(await setStock(stockId, 10, 4)).toEqual({ ok: true, quantity: 4 });
      expect(await quantity()).toBe(4);
    });

    it("refuses a stale value and changes nothing", async () => {
      await setQuantity(8); // a sale happened after the page loaded
      expect(await setStock(stockId, 10, 15)).toEqual({ ok: false, reason: "conflict", current: 8 });
      expect(await quantity()).toBe(8);
    });

    it("reports a deleted size", async () => {
      expect(await setStock(2_000_000_000, 0, 1)).toEqual({ ok: false, reason: "missing" });
    });
  });

  describe("adjustStock", () => {
    it("adds and removes units", async () => {
      expect(await adjustStock(stockId, 5)).toEqual({ ok: true, quantity: 15 });
      expect(await adjustStock(stockId, -15)).toEqual({ ok: true, quantity: 0 });
    });

    it("never goes below 0", async () => {
      expect(await adjustStock(stockId, -11)).toEqual({ ok: false, reason: "below-zero", current: 10 });
      expect(await quantity()).toBe(10);
    });

    it("never goes above 9,999", async () => {
      expect(await adjustStock(stockId, 9990)).toEqual({ ok: false, reason: "above-max", current: 10 });
    });

    it("loses nothing under concurrent adjustments", async () => {
      await setQuantity(50);
      const results = await Promise.all([
        ...Array.from({ length: 20 }, () => adjustStock(stockId, 1)),
        ...Array.from({ length: 20 }, () => adjustStock(stockId, -1)),
      ]);
      expect(results.every((r) => r.ok)).toBe(true);
      expect(await quantity()).toBe(50);
    });
  });

  describe("with checkout reservations", () => {
    it("adjusting while checkouts reserve never oversells or loses units", async () => {
      // 10 in stock; three checkouts want 3 each while an admin writes off 5.
      const [adjust, ...reserves] = await Promise.allSettled([
        adjustStock(stockId, -5),
        reserve(3),
        reserve(3),
        reserve(3),
      ]);
      const reserved = reserves.filter((r) => r.status === "fulfilled").length;
      for (const r of reserves) {
        if (r.status === "rejected") expect(r.reason).toBeInstanceOf(StockConflictError);
      }
      const writtenOff = adjust.status === "fulfilled" && adjust.value.ok ? 5 : 0;

      const final = await quantity();
      expect(final).toBeGreaterThanOrEqual(0);
      expect(final).toBe(10 - 3 * reserved - writtenOff);
    });

    it("a release returns units to the same row after an admin adjustment", async () => {
      const orderId = await reserve(2); // 10 → 8
      expect((await heldUnits([productId])).get(sizeKey(productId, "M"))).toBe(2);

      expect(await adjustStock(stockId, 5)).toEqual({ ok: true, quantity: 13 });
      await endOrderAndRelease(orderId, "expired"); // +2
      expect(await quantity()).toBe(15);
      expect((await heldUnits([productId])).get(sizeKey(productId, "M")) ?? 0).toBe(0);

      // Releasing twice must not add the units again.
      await endOrderAndRelease(orderId, "expired");
      expect(await quantity()).toBe(15);
    });
  });
  describe("removing sizes (admin product form)", () => {
    const pgCode = (e: unknown) => (e as { code?: string; cause?: { code?: string } }).code ?? (e as { cause?: { code?: string } }).cause?.code;

    it("refuses, inside the transaction, to delete a size an unpaid checkout holds", async () => {
      const orderId = await reserve(1);
      const [lock, del] = deleteUnheldSizesStatements([stockId]);
      const error = await db.batch([lock, del]).then(() => null, (e: unknown) => e);
      expect(pgCode(error)).toBe(SIZE_HELD_ERROR);
      expect(await quantity()).toBe(9); // row still there, nothing changed
      await endOrderAndRelease(orderId, "expired");
      expect(await quantity()).toBe(10);
    });

    it("deletes a size nobody holds", async () => {
      const [extra] = await db
        .insert(productStock)
        .values({ productId, sizeLabel: "XL", quantity: 3 })
        .returning({ id: productStock.id });
      const [lock, del] = deleteUnheldSizesStatements([extra.id]);
      await db.batch([lock, del]);
      expect(await db.query.productStock.findFirst({ where: eq(productStock.id, extra.id) })).toBeUndefined();
    });
  });

  describe("amount-mismatch orders", () => {
    it("holdForReview keeps the stock and takes the order out of the stale sweep", async () => {
      const orderId = await reserve(1); // 10 → 9
      // Make it look stale: reservation ended over an hour ago.
      await db.update(orders).set({ reservationExpiresAt: new Date(Date.now() - 2 * 3600_000) }).where(eq(orders.id, orderId));
      expect((await findStalePendingOrders(1000)).some((o) => o.id === orderId)).toBe(true);

      await holdForReview(orderId);
      expect((await findStalePendingOrders(1000)).some((o) => o.id === orderId)).toBe(false);
      expect(await quantity()).toBe(9);
      await endOrderAndRelease(orderId, "expired");
    });
  });
});
