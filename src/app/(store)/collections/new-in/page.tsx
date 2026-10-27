import type { Metadata } from "next";

import { CollectionView } from "@/components/collection/collection-view";
import { getNewArrivals } from "@/lib/product-queries";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The newest pieces in the Atelier collection, most recent first.",
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return <CollectionView eyebrow="Just arrived" title="New arrivals" products={products} />;
}
