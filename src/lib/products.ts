/*
 * Sample product catalog, shared by the homepage, product pages and bag.
 * Replace with database queries once products live in Postgres.
 * Prices are in cents. Stock is per size; one-size items have a single
 * "One size" entry.
 */

import type { Photo } from "./catalog";

export type CategorySlug =
  | "bags"
  | "shoes"
  | "ready-to-wear"
  | "jewelry-watches"
  | "accessories";

export const categoryLabels: Record<CategorySlug, string> = {
  bags: "Bags",
  shoes: "Shoes",
  "ready-to-wear": "Ready-to-wear",
  "jewelry-watches": "Jewelry & watches",
  accessories: "Accessories",
};

export type SizeOption = { label: string; stock: number };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  price: number;
  badge?: string;
  category: CategorySlug;
  color: { name: string; hex: string };
  sizes: SizeOption[];
  description: string;
  details: string[];
  /** Used on cards (homepage, related products). */
  image: Photo;
};

export const ONE_SIZE = "One size";

/** At or below this, a size counts as "low stock". */
export const LOW_STOCK_THRESHOLD = 3;

/** Most units of one size a customer can hold in the bag. */
export const MAX_PER_ITEM = 5;

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const products: Product[] = [
  {
    slug: "leather-satchel",
    sku: "AT-BG-1042",
    name: "Leather satchel",
    price: 285000,
    badge: "New in",
    category: "bags",
    color: { name: "Dove grey", hex: "#8c8a88" },
    sizes: [{ label: ONE_SIZE, stock: 6 }],
    description:
      "A compact satchel cut from smooth calf leather, with two buckled straps and a top handle. Carry it by hand or wear it cross-body on the adjustable strap.",
    details: [
      "Smooth calf leather",
      "Cotton-linen lining",
      "Antique silver-tone hardware",
      "Adjustable, detachable shoulder strap",
      "W 26 × H 19 × D 9 cm",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1605733513597-a8f8341084e6"),
      alt: "Grey leather satchel with two buckled straps",
    },
  },
  {
    slug: "croc-effect-mini-bag",
    sku: "AT-BG-1077",
    name: "Croc-effect mini bag",
    price: 225000,
    badge: "New in",
    category: "bags",
    color: { name: "Bordeaux", hex: "#5a1a22" },
    sizes: [{ label: ONE_SIZE, stock: 2 }],
    description:
      "A small structured bag in croc-embossed leather with a sculpted metal clasp. Sized for the essentials: phone, cards and keys.",
    details: [
      "Croc-embossed calf leather",
      "Suede lining",
      "Gold-tone clasp",
      "Top handle",
      "W 15 × H 19 × D 6 cm",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1575032617751-6ddec2089882"),
      alt: "Burgundy croc-effect leather bag held up by its handle",
    },
  },
  {
    slug: "printed-satin-pump",
    sku: "AT-SH-2210",
    name: "Printed satin pump",
    price: 89000,
    category: "shoes",
    color: { name: "Blue floral", hex: "#2f6fb5" },
    sizes: [
      { label: "36", stock: 4 },
      { label: "37", stock: 2 },
      { label: "38", stock: 0 },
      { label: "39", stock: 5 },
      { label: "40", stock: 1 },
      { label: "41", stock: 0 },
    ],
    description:
      "A pointed pump in printed silk satin on a slender 100 mm heel. The floral print is engineered so every pair is slightly different.",
    details: [
      "Printed silk satin upper",
      "Leather lining and sole",
      "100 mm heel",
      "Fits true to size",
      "Made in Italy",
    ],
    image: {
      src: unsplash("1543163521-1bf539c55dd2"),
      alt: "Pair of floral satin high-heel pumps",
    },
  },
  {
    slug: "leather-strap-watch",
    sku: "AT-JW-3105",
    name: "Leather strap watch",
    price: 420000,
    category: "jewelry-watches",
    color: { name: "Rose gold / taupe", hex: "#b88a6a" },
    sizes: [{ label: ONE_SIZE, stock: 9 }],
    description:
      "A slim 36 mm watch with a white lacquered dial, rose gold-tone case and a soft taupe leather strap. Swiss quartz movement.",
    details: [
      "36 mm stainless steel case, rose gold-tone PVD",
      "White lacquered dial",
      "Swiss quartz movement",
      "Water resistant to 30 m",
      "Interchangeable leather strap",
    ],
    image: {
      src: unsplash("1524592094714-0f0654e20314"),
      alt: "Hand holding a watch with a white dial and taupe leather strap",
    },
  },
  {
    slug: "round-metal-sunglasses",
    sku: "AT-AC-4012",
    name: "Round metal sunglasses",
    price: 46000,
    badge: "New in",
    category: "accessories",
    color: { name: "Gold / green", hex: "#c9a35b" },
    sizes: [{ label: ONE_SIZE, stock: 0 }],
    description:
      "Round sunglasses with a fine gold-tone metal frame and green mineral-glass lenses. Comes with a leather case.",
    details: [
      "Gold-tone metal frame",
      "Green mineral-glass lenses",
      "100% UV protection",
      "Adjustable nose pads",
      "Leather case included",
    ],
    image: {
      src: unsplash("1511499767150-a48a237f0083"),
      alt: "Round gold-frame sunglasses with green lenses",
    },
  },
  {
    slug: "layered-pendant-necklace",
    sku: "AT-JW-3150",
    name: "Layered pendant necklace",
    price: 135000,
    category: "jewelry-watches",
    color: { name: "Gold", hex: "#c6a15b" },
    sizes: [{ label: ONE_SIZE, stock: 3 }],
    description:
      "Two fine chains worn together: one with a faceted blue stone, one with a crescent set with small crystals.",
    details: [
      "18k gold-plated sterling silver",
      "Faceted blue glass stone",
      "Lengths 42 cm and 50 cm",
      "Lobster clasp",
    ],
    image: {
      src: unsplash("1599643478518-a784e5dc4c8f"),
      alt: "Layered gold necklaces with a blue stone and a crescent pendant",
    },
  },
  {
    slug: "satin-bomber-jacket",
    sku: "AT-RW-5320",
    name: "Satin bomber jacket",
    price: 310000,
    category: "ready-to-wear",
    color: { name: "Copper", hex: "#b4704e" },
    sizes: [
      { label: "XS", stock: 1 },
      { label: "S", stock: 4 },
      { label: "M", stock: 6 },
      { label: "L", stock: 0 },
      { label: "XL", stock: 2 },
    ],
    description:
      "A lightweight bomber in washed satin with a ribbed collar, cuffs and hem, and a utility pocket on the sleeve.",
    details: [
      "100% polyamide satin",
      "Ribbed knit trims",
      "Two-way front zip",
      "Regular fit; true to size",
      "Dry clean only",
    ],
    image: {
      src: unsplash("1591047139829-d91aecb6caea"),
      alt: "Copper satin bomber jacket on a hanger",
    },
  },
  {
    slug: "leather-lace-up-boot",
    sku: "AT-SH-2290",
    name: "Leather lace-up boot",
    price: 98000,
    category: "shoes",
    color: { name: "Cognac", hex: "#8a4b22" },
    sizes: [
      { label: "40", stock: 3 },
      { label: "41", stock: 7 },
      { label: "42", stock: 0 },
      { label: "43", stock: 5 },
      { label: "44", stock: 2 },
      { label: "45", stock: 0 },
    ],
    description:
      "A Goodyear-welted boot in waxed cognac leather with a lug rubber sole. Built to be resoled.",
    details: [
      "Waxed full-grain leather",
      "Goodyear-welted construction",
      "Rubber lug sole",
      "Leather lining",
      "Fits true to size",
    ],
    image: {
      src: unsplash("1520639888713-7851133b1ed0"),
      alt: "Pair of brown leather lace-up boots",
      position: "50% 65%",
    },
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/** Same category first, then the rest; never the product itself. */
export function getRelatedProducts(product: Product, limit = 8) {
  const others = products.filter((p) => p.slug !== product.slug);
  return [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, limit);
}

export function isOneSize(product: Product) {
  return product.sizes.length === 1 && product.sizes[0].label === ONE_SIZE;
}

export function totalStock(product: Product) {
  return product.sizes.reduce((sum, s) => sum + s.stock, 0);
}

export type StockState =
  | { kind: "in-stock" }
  | { kind: "low-stock"; left: number }
  | { kind: "out-of-stock" };

export function stockState(stock: number): StockState {
  if (stock <= 0) return { kind: "out-of-stock" };
  if (stock <= LOW_STOCK_THRESHOLD) return { kind: "low-stock", left: stock };
  return { kind: "in-stock" };
}
