import { and, asc, desc, eq, inArray, lte, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, productStock, products, user } from "@/db/schema";
import { heldUnits, sizeKey } from "@/lib/inventory";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

/*
 * Admin reads. Every function checks the admin role itself (like
 * account-orders.ts), so no caller can forget. Not cached on purpose:
 * admins need live stock and order data.
 */

type OrderStatus = (typeof orders.$inferSelect)["paymentStatus"];

export const ORDER_STATUSES: OrderStatus[] = ["paid", "processing", "pending", "failed", "expired"];

/** "placed" = paid + processing (the default view). */
export type OrderFilter = "placed" | "all" | OrderStatus;

export function parseOrderFilter(value: unknown): OrderFilter {
  if (value === "all" || value === "placed") return value;
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "placed";
}

export function parseId(value: string) {
  if (!/^\d{1,9}$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export type ProductListFilter = { categoryId?: number; listed?: boolean };

export async function listProducts({ categoryId, listed }: ProductListFilter = {}) {
  await requireAdmin();
  const conditions = [
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    listed === undefined ? undefined : eq(products.isActive, listed),
  ];
  const rows = await db.query.products.findMany({
    where: and(...conditions),
    orderBy: [asc(products.name)],
    columns: { id: true, slug: true, sku: true, name: true, priceCents: true, imageSrc: true, imagePosition: true, isActive: true },
    with: {
      category: { columns: { label: true } },
      stock: { columns: { quantity: true } },
    },
  });
  return rows.map(({ stock, ...p }) => ({
    ...p,
    totalStock: stock.reduce((sum, s) => sum + s.quantity, 0),
    soldOutSizes: stock.filter((s) => s.quantity === 0).length,
    lowSizes: stock.filter((s) => s.quantity > 0 && s.quantity <= LOW_STOCK_THRESHOLD).length,
    sizeCount: stock.length,
  }));
}

export type AdminProductRow = Awaited<ReturnType<typeof listProducts>>[number];

export async function getProductForEdit(id: number) {
  await requireAdmin();
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      stock: { orderBy: [asc(productStock.sortOrder), asc(productStock.id)] },
      images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] },
    },
  });
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

export async function listCategories() {
  await requireAdmin();
  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.label)],
    with: { products: { columns: { id: true } } },
  });
  return rows.map(({ products: p, ...c }) => ({ ...c, productCount: p.length }));
}

export type AdminCategoryRow = Awaited<ReturnType<typeof listCategories>>[number];

export type StockFilter = "all" | "low" | "sold-out";

export function parseStockFilter(value: unknown): StockFilter {
  return value === "low" || value === "sold-out" ? value : "all";
}

/**
 * One row per product size, with units held by unpaid checkouts.
 * "low" = at or below LOW_STOCK_THRESHOLD (sold out included); "sold-out" = 0.
 */
export async function listStockRows(filter: StockFilter) {
  await requireAdmin();
  const rows = await db
    .select({
      id: productStock.id,
      sizeLabel: productStock.sizeLabel,
      quantity: productStock.quantity,
      productId: products.id,
      productName: products.name,
      sku: products.sku,
      isActive: products.isActive,
      imageSrc: products.imageSrc,
      imagePosition: products.imagePosition,
    })
    .from(productStock)
    .innerJoin(products, eq(products.id, productStock.productId))
    .where(
      filter === "low"
        ? lte(productStock.quantity, LOW_STOCK_THRESHOLD)
        : filter === "sold-out"
          ? eq(productStock.quantity, 0)
          : undefined,
    )
    .orderBy(asc(products.name), asc(productStock.sortOrder), asc(productStock.id));

  const held = await heldUnits(rows.map((r) => r.productId));
  return rows.map((r) => ({ ...r, held: held.get(sizeKey(r.productId, r.sizeLabel)) ?? 0 }));
}

/** Units held by unpaid checkouts for one product, by size label. */
export async function getHeldUnitsBySize(productId: number) {
  await requireAdmin();
  const held = await heldUnits([productId]);
  const prefix = `${productId}:`;
  return new Map([...held].map(([key, n]) => [key.slice(prefix.length), n]));
}

export type AdminStockRow = Awaited<ReturnType<typeof listStockRows>>[number];

/** Newest first, at most 200. */
export async function listOrders(filter: OrderFilter) {
  await requireAdmin();
  let where: SQL | undefined;
  if (filter === "placed") where = inArray(orders.paymentStatus, ["paid", "processing"]);
  else if (filter !== "all") where = eq(orders.paymentStatus, filter);

  return db
    .select({
      number: orders.number,
      createdAt: orders.createdAt,
      paymentStatus: orders.paymentStatus,
      email: orders.email,
      accountEmail: user.email,
      totalCents: orders.amountTotalCents,
      subtotalCents: orders.subtotalCents,
    })
    .from(orders)
    .leftJoin(user, eq(user.id, orders.userId))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(200);
}

export type AdminOrderRow = Awaited<ReturnType<typeof listOrders>>[number];

export async function getOrder(orderNumber: number) {
  await requireAdmin();
  return db.query.orders.findFirst({
    where: eq(orders.number, orderNumber),
    with: {
      user: { columns: { name: true, email: true } },
      items: {
        orderBy: (i, { asc }) => [asc(i.id)],
        with: { product: { columns: { imageSrc: true, imagePosition: true } } },
      },
    },
  });
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
