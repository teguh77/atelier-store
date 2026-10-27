import type { Metadata } from "next";
import { Suspense } from "react";

import { BagView } from "@/components/bag/bag-view";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false } };

/* The bag reads the cart cookie, live stock and the URL, so it renders inside Suspense. */
export default function BagPage({ searchParams }: PageProps<"/bag">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <Bag searchParams={searchParams} />
    </Suspense>
  );
}

async function Bag({ searchParams }: Pick<PageProps<"/bag">, "searchParams">) {
  const { checkout } = await searchParams;
  // Stripe's cancel_url sends customers back here with ?checkout=canceled.
  return <BagView checkoutCanceled={checkout === "canceled"} />;
}
