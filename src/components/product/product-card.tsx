import { UnsplashImage } from "@/components/ui/unsplash-image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { productAvailability, type Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  /** Passed to next/image so the browser picks the right file size. */
  sizes: string;
};

/**
 * Product tile: 3:4 image on the canvas tone, name and price beneath, plus
 * "Sold out" or "Only N left" from the product's live stock (same rule as the
 * product page). Sold-out tiles stay linked so shoppers can still see the piece.
 */
export function ProductCard({ product, sizes }: ProductCardProps) {
  const availability = productAvailability(product);
  const soldOut = availability.kind === "out-of-stock";
  const note =
    availability.kind === "out-of-stock"
      ? "Sold out"
      : availability.kind === "low-stock"
        ? `Only ${availability.left} left`
        : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col"
      aria-label={`${product.name}, ${formatPrice(product.price)}${note ? `, ${note.toLowerCase()}` : ""}`}
    >
      <div className="media-cover">
        <UnsplashImage
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes={sizes}
          className={cn(
            "transition-transform duration-[var(--duration-slow)] ease-luxe group-hover:scale-[1.04]",
            soldOut && "opacity-50",
          )}
        />
        {product.badge && !soldOut && (
          <span className="type-caption absolute left-4 top-4 z-10 opacity-80">
            {product.badge}
          </span>
        )}
      </div>
      <div className="product-info">
        <span className="type-small">{product.name}</span>
        <span className={cn("type-small-medium", soldOut && "text-muted")}>{formatPrice(product.price)}</span>
        {note && (
          <span className="type-small flex items-center gap-2" aria-hidden="true">
            <span className={cn("size-2 shrink-0 rounded-full", soldOut ? "bg-muted" : "bg-warning")} />
            <span className={soldOut ? "text-muted" : undefined}>{note}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
