"use server";

import { z } from "zod";

import { MAX_PER_ITEM, ONE_SIZE } from "@/lib/products";

import { buildCart } from "./build";
import { readCartCookie, writeCartCookie } from "./cookie";
import { getLiveProducts } from "./queries";
import { MAX_LINES, maxQuantity, sameLine, type StoredLine } from "./rules";

/*
 * Cart mutations. The client sends only *what* it wants (slug, size,
 * quantity). Prices, names and stock are always read live from Postgres.
 * Writing the cookie makes Next re-render the current page and layouts,
 * so the bag page and header count update on their own.
 */

export type CartActionResult = {
  ok: boolean;
  message: string;
  /** Units of this product size in the bag after the action. */
  inCart: number;
};

const lineSchema = z.object({
  slug: z.string().min(1).max(200),
  size: z.string().min(1).max(50),
});
const quantitySchema = z.number().int().min(1).max(MAX_PER_ITEM);

const INVALID: CartActionResult = {
  ok: false,
  message: "Something went wrong. Please refresh the page and try again.",
  inCart: 0,
};

/** Current lines, already corrected against live stock, plus live data for `extraSlug`. */
async function loadCart(extraSlug?: string) {
  const stored = await readCartCookie();
  const slugs = stored.map((l) => l.slug);
  if (extraSlug) slugs.push(extraSlug);
  const live = await getLiveProducts(slugs);
  const { corrected } = buildCart(stored, live);
  return { lines: corrected, live };
}

function describe(name: string, size: string) {
  return size === ONE_SIZE ? name : `${name}, size ${size}`;
}

export async function addToCart(slug: string, size: string, quantity: number): Promise<CartActionResult> {
  const target = lineSchema.safeParse({ slug, size });
  const qty = quantitySchema.safeParse(quantity);
  if (!target.success || !qty.success) return INVALID;

  const { lines, live } = await loadCart(slug);
  const product = live.get(slug);
  const stock = product?.stock.get(size);
  const existing = lines.find((l) => sameLine(l, target.data));
  const inCart = existing?.quantity ?? 0;

  if (!product || stock === undefined) {
    return { ok: false, message: "This item is no longer available.", inCart: 0 };
  }
  const max = maxQuantity(stock);
  if (max === 0) {
    return { ok: false, message: "Sorry, this size has just sold out.", inCart };
  }

  const room = max - inCart;
  if (room <= 0) {
    const message =
      stock <= MAX_PER_ITEM
        ? "All remaining stock in this size is already in your bag."
        : `You can hold up to ${MAX_PER_ITEM} of this item in your bag.`;
    return { ok: false, message, inCart };
  }
  if (!existing && lines.length >= MAX_LINES) {
    return { ok: false, message: "Your bag is full. Remove an item to add another.", inCart };
  }

  const added = Math.min(qty.data, room);
  const next: StoredLine[] = existing
    ? lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + added } : l))
    : [...lines, { slug, size, quantity: added }];
  await writeCartCookie(next);

  const label = describe(product.name, size);
  const message =
    added < qty.data
      ? `Added ${added}. ${stock <= MAX_PER_ITEM ? `Only ${stock} left in this size.` : `The limit is ${MAX_PER_ITEM} per item.`}`
      : `Added to your bag: ${label}, quantity ${added}.`;
  return { ok: true, message, inCart: inCart + added };
}

export async function updateCartQuantity(
  slug: string,
  size: string,
  quantity: number,
): Promise<CartActionResult> {
  const target = lineSchema.safeParse({ slug, size });
  const qty = quantitySchema.safeParse(quantity);
  if (!target.success || !qty.success) return INVALID;

  const { lines, live } = await loadCart();
  const existing = lines.find((l) => sameLine(l, target.data));
  const stock = live.get(slug)?.stock.get(size);
  if (!existing || stock === undefined) {
    await writeCartCookie(lines);
    return { ok: false, message: "This item is no longer in your bag.", inCart: 0 };
  }

  const max = maxQuantity(stock);
  if (max === 0) {
    await writeCartCookie(lines);
    return { ok: false, message: "This size has sold out. Remove it to continue.", inCart: existing.quantity };
  }

  const nextQuantity = Math.min(qty.data, max);
  await writeCartCookie(lines.map((l) => (l === existing ? { ...l, quantity: nextQuantity } : l)));

  if (nextQuantity < qty.data) {
    return { ok: false, message: `Only ${max} available.`, inCart: nextQuantity };
  }
  return { ok: true, message: `Quantity updated to ${nextQuantity}.`, inCart: nextQuantity };
}

export async function removeFromCart(slug: string, size: string): Promise<CartActionResult> {
  const target = lineSchema.safeParse({ slug, size });
  if (!target.success) return INVALID;

  const { lines } = await loadCart();
  await writeCartCookie(lines.filter((l) => !sameLine(l, target.data)));
  return { ok: true, message: "Item removed from your bag.", inCart: 0 };
}
