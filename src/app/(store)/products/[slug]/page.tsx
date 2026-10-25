import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductRail } from "@/components/home/product-rail";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { AccordionItem } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/format";
import { categoryLabels, getProduct, getRelatedProducts, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = categoryLabels[product.category];
  const categoryHref = `/collections/${product.category}`;

  return (
    <>
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
              <li>
                <Link href={categoryHref} className="link-reveal hover:text-foreground">
                  {category}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {product.name}
              </li>
            </ol>
          </nav>
        </Container>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
          <ProductGallery name={product.name} category={product.category} />

          {/* Product info. Sticks beside the gallery on desktop. */}
          <div className="px-gutter pb-section pt-8 lg:px-12 lg:pt-4">
            <div className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
              <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Link href={categoryHref} className="type-caption link-reveal text-muted">
                    {category}
                  </Link>
                  {product.badge && (
                    <span className="type-caption border px-2 py-1">{product.badge}</span>
                  )}
                </div>
                <h1 className="type-title-m">{product.name}</h1>
                <p className="type-body-medium">{formatPrice(product.price)}</p>
                <p className="type-small text-muted">Style {product.sku}</p>
              </header>

              <PurchasePanel product={product} />

              <ul className="type-small flex flex-col gap-2 border-t pt-6 text-muted">
                <li>Complimentary express delivery</li>
                <li>Free returns within 30 days</li>
                <li>Signature gift box included</li>
              </ul>

              <div className="border-t">
                <AccordionItem title="Description" defaultOpen>
                  <p className="type-body">{product.description}</p>
                </AccordionItem>
                <AccordionItem title="Details & care">
                  <ul className="type-small flex list-disc flex-col gap-2 pl-4">
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </AccordionItem>
                <AccordionItem title="Delivery & returns">
                  <div className="type-small flex flex-col gap-3">
                    <p>Express delivery in 1–3 business days, free on every order.</p>
                    <p>
                      Return or exchange within 30 days, in store or by post. Items must be
                      unworn, with tags attached.
                    </p>
                  </div>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <ProductRail title="You may also like" products={getRelatedProducts(product)} />
      </div>
    </>
  );
}
