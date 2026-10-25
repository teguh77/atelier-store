import { UnsplashImage } from "@/components/ui/unsplash-image";
import Link from "next/link";

import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";

type ProductCardProps = {
  product: Product;
  /** Passed to next/image so the browser picks the right file size. */
  sizes: string;
};

/** Product tile: 3:4 image on the canvas tone, name and price beneath. */
export function ProductCard({ product, sizes }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col"
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
    >
      <div className="media-cover">
        <UnsplashImage
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes={sizes}
          className="transition-transform duration-[var(--duration-slow)] ease-luxe group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="type-caption absolute left-4 top-4 z-10 opacity-80">
            {product.badge}
          </span>
        )}
      </div>
      <div className="product-info">
        <span className="type-small">{product.name}</span>
        <span className="type-small-medium">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
}
