import type { ReactNode } from "react";

import { OrderLines } from "@/components/checkout/order-lines";
import { ShippingAddress } from "@/components/checkout/shipping-address";
import { TextLink } from "@/components/ui/text-link";
import type { CustomerOrder } from "@/lib/account-orders";
import { formatDate, formatOrderNumber } from "@/lib/format";

import { OrderStatus } from "./order-status";

const STATUS_NOTE: Partial<Record<CustomerOrder["paymentStatus"], string>> = {
  processing: "We'll confirm your order as soon as your payment clears. Your pieces are reserved until then.",
  failed: "Your payment didn't go through, so you weren't charged and the pieces were released.",
};

/** One of the customer's orders: status, shipping and items. */
export function OrderDetail({ order }: { order: CustomerOrder }) {
  const address = order.shippingAddress;
  const note = STATUS_NOTE[order.paymentStatus];

  return (
    <div className="flex flex-col gap-10 lg:border-t lg:pt-6">
      <div className="flex flex-col gap-6">
        <TextLink href="/account/orders" variant="reveal" className="type-small self-start text-muted">
          ← All orders
        </TextLink>
        <h2 className="type-title-xs">Order {formatOrderNumber(order.number)}</h2>

        <dl className="type-body flex flex-col gap-5">
          <Detail label="Placed">{formatDate(order.createdAt)}</Detail>
          <Detail label="Status">
            <div className="flex flex-col gap-1">
              <OrderStatus status={order.paymentStatus} className="type-body" />
              {note && <p className="type-small text-muted">{note}</p>}
            </div>
          </Detail>
          {order.paidAt && <Detail label="Paid on">{formatDate(order.paidAt)}</Detail>}
          {order.email && <Detail label="Email">{order.email}</Detail>}
          {(order.shippingName || address) && (
            <Detail label="Shipping to">
              <ShippingAddress name={order.shippingName} address={address} />
            </Detail>
          )}
        </dl>
      </div>

      <section aria-labelledby="order-items-title" className="flex flex-col gap-6">
        <h3 id="order-items-title" className="type-title-xs">
          Items
        </h3>
        <OrderLines
          items={order.items}
          subtotalCents={order.subtotalCents}
          amountTotalCents={order.amountTotalCents}
          totalLabel={order.paymentStatus === "paid" ? "Total paid" : "Total"}
        />
      </section>
    </div>
  );
}

/** Label + value row, matching the account overview. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="type-small text-muted sm:pt-0.5">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
