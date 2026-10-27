import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { OrderStatus } from "@/components/account/order-status";
import { AdminPageHeader, LOADING } from "@/components/admin/admin-ui";
import { OrderLines } from "@/components/checkout/order-lines";
import { ShippingAddress } from "@/components/checkout/shipping-address";
import { TextLink } from "@/components/ui/text-link";
import { parseOrderNumber } from "@/lib/account-orders";
import { getOrder } from "@/lib/admin/queries";
import { formatDate, formatOrderNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

/** Read-only. Payment status only changes from Stripe (the webhook). */
export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  return (
    <Suspense fallback={LOADING}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/admin/orders/[number]">, "params">) {
  const orderNumber = parseOrderNumber((await params).number);
  const order = orderNumber ? await getOrder(orderNumber) : undefined;
  if (!order) notFound();

  return (
    <>
      <div className="flex flex-col gap-4">
        <TextLink href="/admin/orders" variant="reveal" className="type-small self-start text-muted">
          ← Orders
        </TextLink>
        <AdminPageHeader caption={formatDate(order.createdAt)} title={`Order ${formatOrderNumber(order.number)}`} />
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <dl className="type-body flex flex-col gap-5 border-t pt-6 lg:self-start">
          <Detail label="Status">
            <OrderStatus status={order.paymentStatus} className="type-body" />
          </Detail>
          {order.paidAt && <Detail label="Paid on">{formatDate(order.paidAt)}</Detail>}
          <Detail label="Customer">
            {order.user ? (
              <>
                {order.user.name}
                <span className="type-small block text-muted">Account: {order.user.email}</span>
              </>
            ) : (
              <span className="text-muted">Guest checkout</span>
            )}
          </Detail>
          {order.email && <Detail label="Checkout email">{order.email}</Detail>}
          {(order.shippingName || order.shippingAddress) && (
            <Detail label="Ship to">
              <ShippingAddress name={order.shippingName} address={order.shippingAddress} />
            </Detail>
          )}
          <Detail label="Stripe">
            <span className="type-small block break-all text-muted">{order.stripeCheckoutSessionId ?? "No session"}</span>
            {order.stripePaymentIntentId && (
              <span className="type-small block break-all text-muted">{order.stripePaymentIntentId}</span>
            )}
          </Detail>
        </dl>

        <section aria-labelledby="order-items-title" className="flex flex-col gap-6 border-t pt-6">
          <h2 id="order-items-title" className="type-title-xs">
            Items
          </h2>
          <OrderLines
            items={order.items}
            subtotalCents={order.subtotalCents}
            amountTotalCents={order.amountTotalCents}
            totalLabel={order.paymentStatus === "paid" ? "Total paid" : "Total"}
          />
        </section>
      </div>
    </>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="type-small text-muted sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
