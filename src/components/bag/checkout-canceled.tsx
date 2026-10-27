"use client";

import { useEffect, useRef } from "react";

import { abandonCheckout } from "@/lib/checkout/actions";

/**
 * Shown when the customer returns from Stripe without paying. Tells the
 * server to end that checkout so the reserved stock returns right away
 * (otherwise it would wait for Stripe's 30-minute expiry). Safe to repeat.
 */
export function CheckoutCanceled() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void abandonCheckout();
  }, []);

  return (
    <p role="status" className="type-small border-l-2 border-foreground py-1 pl-4 lg:col-span-8">
      Checkout canceled. You haven&apos;t been charged, and your bag is saved.
    </p>
  );
}
