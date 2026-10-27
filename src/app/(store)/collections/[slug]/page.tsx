import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionView } from "@/components/collection/collection-view";
import { getCategoryCollection, getCategorySlugs } from "@/lib/product-queries";

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCategoryCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return { title: collection.label, description: `Shop ${collection.label} at Atelier.` };
}

/* Reads the URL inside Suspense, as on the product page. */
export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <CollectionDetails params={params} />
    </Suspense>
  );
}

async function CollectionDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCategoryCollection(slug);
  if (!collection) notFound();

  return (
    <CollectionView eyebrow="Collection" title={collection.label} products={collection.products} />
  );
}
