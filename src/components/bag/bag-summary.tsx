import { CheckoutButton } from "@/components/bag/checkout-button";
import { TextLink } from "@/components/ui/text-link";
import type { Cart } from "@/lib/cart/rules";
import { formatPrice } from "@/lib/format";

/**
 * Order summary and checkout. Every figure comes from the server-built cart.
 * Shipping matches the Stripe session: one complimentary US rate, no tax.
 */
export function BagSummary({ cart, checkoutAvailable }: { cart: Cart; checkoutAvailable: boolean }) {
  const soldOut = cart.lines.filter((l) => l.status === "sold-out").length;
  const items = `${cart.count} ${cart.count === 1 ? "item" : "items"}`;
  const note = !checkoutAvailable
    ? "Checkout is temporarily unavailable. Your bag is saved; please try again later."
    : soldOut > 0
      ? "Remove sold-out items to check out."
      : "You'll pay securely on Stripe. Your pieces are held for 30 minutes while you pay.";

  return (
    <section
      aria-labelledby="bag-summary-title"
      className="flex flex-col gap-6 bg-subtle p-6 md:p-8 lg:sticky lg:top-[calc(var(--header-height)+2rem)]"
    >
      <h2 id="bag-summary-title" className="type-title-xs">
        Summary
      </h2>

      <dl className="type-small flex flex-col gap-3">
        <div className="flex justify-between gap-4">
          <dt>Subtotal ({items})</dt>
          <dd className="type-small-medium" aria-live="polite">
            {formatPrice(cart.subtotal)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 text-muted">
          <dt>Shipping (US)</dt>
          <dd>Complimentary</dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-3">
          <dt className="type-small-medium">Total</dt>
          <dd className="type-small-medium">{formatPrice(cart.subtotal)}</dd>
        </div>
      </dl>

      {soldOut > 0 && (
        <p className="type-small text-muted">
          {soldOut === 1 ? "1 sold-out item isn't" : `${soldOut} sold-out items aren't`} included in the
          subtotal.
        </p>
      )}

      <div className="flex flex-col gap-3 border-t pt-6">
        <CheckoutButton disabled={!checkoutAvailable || soldOut > 0 || cart.count === 0} />
        <p className="type-small text-muted">{note}</p>
      </div>

      <TextLink href="/collections/new-in" className="type-small self-start">
        Continue shopping
      </TextLink>
    </section>
  );
}
