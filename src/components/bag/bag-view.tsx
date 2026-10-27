import { BagLine } from "@/components/bag/bag-line";
import { BagSummary } from "@/components/bag/bag-summary";
import { CheckoutCanceled } from "@/components/bag/checkout-canceled";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getCart } from "@/lib/cart/build";
import { isStripeConfigured } from "@/lib/stripe";

/** The bag page: title, lines and summary, or the empty state. */
export async function BagView({ checkoutCanceled = false }: { checkoutCanceled?: boolean }) {
  const cart = await getCart();
  const empty = cart.lines.length === 0;
  const items = `${cart.count} ${cart.count === 1 ? "item" : "items"}`;

  return (
    <div className="pt-header">
      <Container className="flex flex-col gap-8 py-12 md:py-16 lg:grid lg:grid-cols-12 lg:gap-x-grid lg:gap-y-10">
        <header className="flex flex-col gap-3 lg:col-span-12">
          <p className="type-caption text-muted">Shopping bag</p>
          {/* Focused after removing a line, so keyboard users keep their place. */}
          <h1 id="bag-title" tabIndex={-1} className="type-title-l outline-none">
            Your bag
            {!empty && <span className="type-small ml-3 normal-case text-muted">{items}</span>}
          </h1>
        </header>

        {checkoutCanceled && <CheckoutCanceled />}

        {cart.removedCount > 0 && (
          <p role="status" className="type-small border-l-2 border-warning py-1 pl-4 lg:col-span-8">
            {cart.removedCount === 1
              ? "1 item is no longer available and was removed from your bag."
              : `${cart.removedCount} items are no longer available and were removed from your bag.`}
          </p>
        )}

        {empty ? (
          <div className="flex flex-col items-start gap-6 border-t pt-8 lg:col-span-8">
            <div className="flex flex-col gap-2">
              <p className="type-body">Your bag is empty.</p>
              <p className="type-small text-muted">Pieces you add to your bag will appear here.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ButtonLink href="/collections/new-in" block="mobile">
                Shop new arrivals
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" block="mobile">
                Back to home
              </ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <section aria-labelledby="bag-title" className="lg:col-span-7">
              <ul className="divide-y border-y">
                {cart.lines.map((line) => (
                  <BagLine key={`${line.slug}:${line.size}`} line={line} />
                ))}
              </ul>
            </section>
            <div className="lg:col-span-4 lg:col-start-9">
              <BagSummary cart={cart} checkoutAvailable={isStripeConfigured()} />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
