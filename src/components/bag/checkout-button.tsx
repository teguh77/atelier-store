"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { startCheckout, type CheckoutState } from "@/lib/checkout/actions";

/**
 * Starts Stripe Checkout. Sends no data: the server reads the bag from its
 * cookie and prices it from the database, then redirects to Stripe.
 */
export function CheckoutButton({ disabled = false }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {
    error: null,
  });

  return (
    <form
      action={action}
      // A second submit would reserve stock for a second order.
      onSubmit={(e) => pending && e.preventDefault()}
      className="flex flex-col gap-3"
    >
      {/* Not `disabled` while pending, so the button keeps its fill. */}
      <Button
        type="submit"
        block
        disabled={disabled}
        aria-busy={pending || undefined}
        className={pending ? "cursor-wait" : undefined}
      >
        {pending && <Spinner />}
        {pending ? "Reserving your pieces" : "Checkout"}
      </Button>
      <p role="status" className={pending || state.error ? "type-small" : "sr-only"}>
        {pending ? (
          <span className="text-muted">Taking you to secure payment…</span>
        ) : (
          <span className="text-error">{state.error}</span>
        )}
      </p>
    </form>
  );
}
