"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { UnsplashImage } from "@/components/ui/unsplash-image";
import { removeFromCart, updateCartQuantity } from "@/lib/cart/actions";
import type { CartLine } from "@/lib/cart/rules";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { LOW_STOCK_THRESHOLD, MAX_PER_ITEM } from "@/lib/products";

/**
 * One bag row: photo, name, color/size, price, quantity, remove.
 * Changes go to the server, which checks live stock and re-renders the
 * page (including the subtotal). The quantity updates instantly here and
 * snaps back if the server refuses it.
 */
export function BagLine({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [quantity, setOptimisticQuantity] = useOptimistic(line.quantity);
  const [error, setError] = useState<string | null>(null);

  const soldOut = line.status === "sold-out";
  const href = `/products/${line.slug}`;

  function changeQuantity(next: number) {
    setError(null);
    startTransition(async () => {
      setOptimisticQuantity(next);
      const result = await updateCartQuantity(line.slug, line.size, next);
      if (!result.ok) setError(result.message);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeFromCart(line.slug, line.size);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // The row is gone; put focus somewhere sensible.
      document.getElementById("bag-title")?.focus();
    });
  }

  return (
    <li
      className={cn("flex gap-4 py-6 transition-opacity md:gap-6", pending && "opacity-60")}
      aria-busy={pending || undefined}
    >
      <Link href={href} className="media-cover w-24 shrink-0 self-start md:w-32" tabIndex={-1} aria-hidden="true">
        <UnsplashImage
          src={line.image.src}
          alt=""
          fill
          sizes="(min-width: 48rem) 128px, 96px"
          className={cn(soldOut && "opacity-50")}
          style={line.image.position ? { objectPosition: line.image.position } : undefined}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Link href={href} className="type-small-medium link-reveal self-start">
              {line.name}
            </Link>
            <p className="type-small text-muted">
              {line.colorName}
              {line.showSize && <> · Size {line.size}</>}
            </p>
            <p className="type-small text-muted">
              {formatPrice(line.unitPrice)}
              {quantity > 1 && " each"}
            </p>
          </div>
          <p className="type-small-medium shrink-0 text-right">
            {soldOut ? (
              <span className="text-muted">—</span>
            ) : (
              formatPrice(line.unitPrice * quantity)
            )}
          </p>
        </div>

        <StockNote line={line} quantity={quantity} />

        <div className="mt-auto flex items-center justify-between gap-4">
          {soldOut ? (
            <span className="type-small text-muted">Unavailable</span>
          ) : (
            <QuantityStepper
              compact
              value={quantity}
              max={line.maxQuantity}
              onChange={changeQuantity}
              disabled={pending}
              label={`Quantity, ${line.name}`}
            />
          )}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="type-small link-underline cursor-pointer disabled:cursor-wait"
          >
            Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>

        <p role="status" className={cn("type-small text-error", !error && "sr-only")}>
          {error}
        </p>
      </div>
    </li>
  );
}

/** Stock message for a line, in the same dot + text style as the product page. */
function StockNote({ line, quantity }: { line: CartLine; quantity: number }) {
  let tone: string | null = null;
  let text = "";

  if (line.status === "sold-out") {
    tone = "bg-muted";
    text = "Sold out in this size. Remove it to continue.";
  } else if (line.status === "reduced") {
    tone = "bg-warning";
    text = `Only ${line.maxQuantity} left, so we've updated the quantity.`;
  } else if (line.limitedByStock && line.maxQuantity <= LOW_STOCK_THRESHOLD) {
    tone = "bg-warning";
    text = line.maxQuantity === 1 ? "Low stock: only 1 left" : `Low stock: only ${line.maxQuantity} left`;
  } else if (!line.limitedByStock && quantity >= MAX_PER_ITEM) {
    text = `Limit of ${MAX_PER_ITEM} per item.`;
  }

  if (!text) return null;
  return (
    <p className="type-small flex items-center gap-2">
      {tone && <span className={cn("size-2 shrink-0 rounded-full", tone)} aria-hidden="true" />}
      <span className={cn(!tone && "text-muted")}>{text}</span>
    </p>
  );
}
