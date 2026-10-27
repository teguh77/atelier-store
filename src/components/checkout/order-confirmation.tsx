import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";
import { TextLink } from "@/components/ui/text-link";
import { findOrderBySessionId, type ConfirmationOrder } from "@/lib/checkout/orders";
import { cn } from "@/lib/cn";
import { formatDate, formatOrderNumber } from "@/lib/format";

import { ConfirmationWatcher } from "./confirmation-watcher";
import { OrderLines } from "./order-lines";

type Status = ConfirmationOrder["paymentStatus"];

const COPY: Record<Status, { title: string; body: string; note: string; tone: string | null }> = {
  paid: {
    title: "Thank you",
    body: "Your payment is confirmed and your order is being prepared.",
    note: "Payment confirmed",
    tone: "bg-success",
  },
  processing: {
    title: "Order placed",
    body: "We'll confirm your order as soon as your payment clears. Your pieces are reserved until then.",
    note: "Payment processing",
    tone: "bg-warning",
  },
  pending: {
    title: "Confirming your payment",
    body: "We're waiting for Stripe to confirm your payment. This usually takes a few seconds.",
    note: "Awaiting confirmation",
    tone: null,
  },
  failed: {
    title: "Payment not completed",
    body: "Your payment didn't go through, so you haven't been charged. Your bag is saved if you'd like to try again.",
    note: "Payment failed",
    tone: "bg-error",
  },
  expired: {
    title: "Checkout expired",
    body: "This checkout ended before payment, so you haven't been charged. Your bag is saved.",
    note: "Not charged",
    tone: "bg-muted",
  },
};

/**
 * Order confirmation for a Stripe session. Read-only: it shows the order's
 * status as recorded from Stripe (by the webhook) and never changes it.
 * Reaching this page doesn't mark anything paid.
 */
export async function OrderConfirmation({ sessionId }: { sessionId: string | null }) {
  const order = sessionId ? await findOrderBySessionId(sessionId) : undefined;
  if (!order || !sessionId) return <OrderNotFound />;
  return <OrderConfirmationView order={order} sessionId={sessionId} />;
}

export function OrderConfirmationView({ order, sessionId }: { order: ConfirmationOrder; sessionId: string }) {
  const status = order.paymentStatus;
  const copy = COPY[status];

  return (
    <Shell>
      <div className="flex flex-col gap-8 lg:col-span-5">
        <header className="flex flex-col gap-3">
          <p className="type-caption text-muted">
            Order {formatOrderNumber(order.number)} · {formatDate(order.createdAt)}
          </p>
          <h1 className="type-title-l">{copy.title}</h1>
          {/* role=status: the polling refresh announces the change when payment confirms. */}
          <div role="status" className="flex flex-col gap-3">
            <p className="type-small-medium flex items-center gap-2">
              {copy.tone ? (
                <span className={cn("size-2 shrink-0 rounded-full", copy.tone)} aria-hidden="true" />
              ) : (
                <Spinner />
              )}
              {copy.note}
            </p>
            {/* No email or address here: anyone holding this link can open the page. */}
            <p className="type-body text-muted">{copy.body}</p>
          </div>
        </header>

        <ConfirmationWatcher sessionId={sessionId} status={status} />

        <Actions status={status} />
      </div>

      <section
        aria-labelledby="order-items-title"
        className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7"
      >
        <h2 id="order-items-title" className="type-title-xs">
          Your order
        </h2>
        <OrderLines
          items={order.items}
          subtotalCents={order.subtotalCents}
          amountTotalCents={order.amountTotalCents}
          totalLabel={status === "paid" ? "Total paid" : "Total"}
        />
      </section>
    </Shell>
  );
}

function Actions({ status }: { status: Status }) {
  if (status === "paid" || status === "processing") {
    return (
      <div>
        <ButtonLink href="/collections/new-in" block="mobile">
          Continue shopping
        </ButtonLink>
      </div>
    );
  }
  if (status === "pending") {
    // Nothing to do but wait; leaving is safe because the webhook updates the order.
    return (
      <TextLink href="/collections/new-in" className="type-small self-start">
        Continue shopping
      </TextLink>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ButtonLink href="/bag" block="mobile">
        Return to bag
      </ButtonLink>
      <ButtonLink href="/collections/new-in" variant="secondary" block="mobile">
        Continue shopping
      </ButtonLink>
    </div>
  );
}

function OrderNotFound() {
  return (
    <Shell>
      <div className="flex max-w-prose-narrow flex-col gap-8 lg:col-span-6">
        <header className="flex flex-col gap-3">
          <p className="type-caption text-muted">Checkout</p>
          <h1 className="type-title-l">Order not found</h1>
          <p className="type-body text-muted">
            We couldn&apos;t find an order for this link. If you were charged, contact client services.
          </p>
        </header>
        <div>
          <ButtonLink href="/" block="mobile">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="pt-header">
      <Container className="flex flex-col gap-12 py-12 md:py-20 lg:grid lg:grid-cols-12 lg:gap-x-grid lg:gap-y-0">
        {children}
      </Container>
    </div>
  );
}
