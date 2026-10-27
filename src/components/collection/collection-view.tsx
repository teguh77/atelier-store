import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import type { Product } from "@/lib/products";

type CollectionViewProps = {
  eyebrow: string;
  title: string;
  products: Product[];
};

/** Collection page: breadcrumb, title, piece count and the product listing grid. */
export function CollectionView({ eyebrow, title, products }: CollectionViewProps) {
  return (
    <div className="pt-header">
      <Container bleed>
        <nav aria-label="Breadcrumb" className="py-4">
          <ol className="type-small flex flex-wrap items-center gap-2 text-muted">
            <li>
              <Link href="/" className="link-reveal hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {title}
            </li>
          </ol>
        </nav>
      </Container>

      <Container className="flex flex-col gap-3 pb-10 pt-8 md:pb-12">
        <p className="type-caption text-muted">{eyebrow}</p>
        <h1 className="type-title-l">{title}</h1>
        <p className="type-small text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </Container>

      {products.length > 0 ? (
        <ul className="product-grid border-t">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      ) : (
        <Container className="py-section">
          <p className="type-body text-muted">No pieces in this collection yet.</p>
        </Container>
      )}
    </div>
  );
}
