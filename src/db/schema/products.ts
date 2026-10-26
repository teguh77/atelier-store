import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/*
 * Categories, products and per-size stock. Prices are integer cents.
 * Stock rows are per size (not variants): one-size items get a single row
 * labelled "One size".
 */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Shown as a tile in the homepage category grid. Needs an image. */
  showOnHome: boolean("show_on_home").notNull().default(false),
  imageSrc: text("image_src"),
  imageAlt: text("image_alt"),
  imagePosition: text("image_position"),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents").notNull(),
    badge: text("badge"),
    colorName: text("color_name").notNull(),
    colorHex: text("color_hex").notNull(),
    details: text("details").array().notNull().default(sql`'{}'`),
    imageSrc: text("image_src").notNull(),
    imageAlt: text("image_alt").notNull(),
    imagePosition: text("image_position"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("products_price_cents_check", sql`${t.priceCents} >= 0`),
    index("products_category_id_idx").on(t.categoryId),
  ],
);

export const productStock = pgTable(
  "product_stock",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeLabel: text("size_label").notNull(),
    quantity: integer("quantity").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique("product_stock_product_size_unique").on(t.productId, t.sizeLabel),
    check("product_stock_quantity_check", sql`${t.quantity} >= 0`),
  ],
);

/** Extra gallery photos. The product's own image is the first photo. */
export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    src: text("src").notNull(),
    alt: text("alt").notNull(),
    position: text("position"),
  },
  (t) => [unique("product_images_product_sort_unique").on(t.productId, t.sortOrder)],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stock: many(productStock),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
}));
