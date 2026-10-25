import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import type { Product } from "@/lib/products";

import { SectionHeader } from "./section-header";

type ProductRailProps = {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
  products: Product[];
};

/** Section title plus a horizontally scrolling row of product tiles. */
export function ProductRail({ eyebrow, title, action, products }: ProductRailProps) {
  return (
    <section className="py-section" aria-labelledby="rail-title">
      <Container>
        <SectionHeader id="rail-title" eyebrow={eyebrow} title={title} action={action} />
      </Container>
      <ul className="scroll-row scroll-px-gutter px-gutter pb-4">
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard
              product={product}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 80vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
