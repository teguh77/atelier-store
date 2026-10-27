import type { Product } from "@/lib/products";

/** Longer queries are cut off, so a pasted paragraph can't cost much work. */
export const MAX_QUERY_LENGTH = 100;

/*
 * Case-insensitive search over the product fields a shopper is likely to
 * type. Each word in the query must appear somewhere in the product.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const terms = query.slice(0, MAX_QUERY_LENGTH).toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.description,
      product.category.label,
      product.color.name,
      product.sku,
      ...product.details,
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
