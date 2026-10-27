import { UnsplashImage } from "@/components/ui/unsplash-image";
import { formatPrice } from "@/lib/format";
import { ONE_SIZE } from "@/lib/products";

export type OrderLineItem = {
  id: number;
  productName: string;
  sizeLabel: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  product: { imageSrc: string; imagePosition: string | null };
};

/**
 * An order's items and totals, from the prices copied at checkout. Shared by
 * the checkout confirmation and the account order page.
 */
export function OrderLines({
  items,
  subtotalCents,
  amountTotalCents,
  totalLabel = "Total",
}: {
  items: OrderLineItem[];
  subtotalCents: number;
  /** What Stripe charged, once known. Falls back to our subtotal. */
  amountTotalCents: number | null;
  totalLabel?: string;
}) {
  return (
    <>
      <ul className="divide-y border-y">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-5">
            <div className="media-cover w-20 shrink-0 self-start">
              <UnsplashImage
                src={item.product.imageSrc}
                alt=""
                fill
                sizes="80px"
                style={item.product.imagePosition ? { objectPosition: item.product.imagePosition } : undefined}
              />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="type-small-medium">{item.productName}</p>
                <p className="type-small text-muted">
                  {item.sizeLabel !== ONE_SIZE && <>Size {item.sizeLabel} · </>}Qty {item.quantity}
                </p>
                {item.quantity > 1 && (
                  <p className="type-small text-muted">{formatPrice(item.unitPriceCents)} each</p>
                )}
              </div>
              <p className="type-small-medium shrink-0">{formatPrice(item.lineTotalCents)}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="type-small flex flex-col gap-3">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd>{formatPrice(subtotalCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-muted">
          <dt>Shipping</dt>
          <dd>Complimentary</dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-3">
          <dt className="type-small-medium">{totalLabel}</dt>
          <dd className="type-small-medium">{formatPrice(amountTotalCents ?? subtotalCents)}</dd>
        </div>
      </dl>
    </>
  );
}
