import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { UnsplashImage } from "@/components/ui/unsplash-image";
import type { CustomerOrderSummary } from "@/lib/account-orders";
import { formatDate, formatPrice, formatOrderNumber } from "@/lib/format";

import { OrderStatus } from "./order-status";

/**
 * The customer's orders, newest first. Each row links to its order page.
 * Phone: photo + stacked details. Tablet up: number, date, status and total
 * in aligned columns.
 */
export function OrderHistory({ orders }: { orders: CustomerOrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 border-t pt-6">
        <div className="flex flex-col gap-2">
          <p className="type-body">You haven&apos;t placed any orders yet.</p>
          <p className="type-small text-muted">Orders you place while signed in will appear here.</p>
        </div>
        <ButtonLink href="/collections/new-in" block="mobile">
          Shop new arrivals
        </ButtonLink>
      </div>
    );
  }

  return (
    <ul className="divide-y border-y">
      {orders.map((order) => {
        const items = `${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`;
        return (
          <li key={order.number}>
            <Link
              href={`/account/orders/${order.number}`}
              className="group flex items-start gap-4 py-5 md:items-center md:gap-6"
            >
              <div className="media-cover w-16 shrink-0 bg-subtle">
                {order.image && (
                  <UnsplashImage
                    src={order.image.imageSrc}
                    alt=""
                    fill
                    sizes="64px"
                    style={order.image.imagePosition ? { objectPosition: order.image.imagePosition } : undefined}
                  />
                )}
              </div>

              <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_9rem] md:items-center md:gap-6">
                <p className="type-small-medium">
                  <span className="link-reveal">{formatOrderNumber(order.number)}</span>
                </p>
                <p className="type-small text-muted">{formatDate(order.createdAt)}</p>
                <OrderStatus status={order.paymentStatus} />
                <p className="type-small md:text-right">
                  <span className="type-small-medium">
                    {formatPrice(order.amountTotalCents ?? order.subtotalCents)}
                  </span>
                  <span className="text-muted"> · {items}</span>
                </p>
              </div>

              <span aria-hidden="true" className="type-small hidden text-muted group-hover:text-foreground md:block">
                View
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
