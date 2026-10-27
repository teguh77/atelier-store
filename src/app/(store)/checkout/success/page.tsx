import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

/*
 * Stripe's success_url lands here with ?session_id=cs_…. The page only
 * displays the order; payment status is set by the webhook from Stripe's
 * own record, never because the browser reached this page.
 */
export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" && /^cs_[A-Za-z0-9_]+$/.test(session_id) ? session_id : null;
  return <OrderConfirmation sessionId={sessionId} />;
}
