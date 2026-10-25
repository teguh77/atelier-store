"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { addToBag, quantityInBag, useBag } from "@/lib/bag";
import { cn } from "@/lib/cn";
import {
  isOneSize,
  MAX_PER_ITEM,
  stockState,
  totalStock,
  type Product,
  type StockState,
} from "@/lib/products";

/**
 * Color, size, quantity, stock state and add to bag.
 * Stock rules:
 * - Sold-out sizes can't be selected.
 * - Quantity never exceeds the size's stock minus what's already in the bag,
 *   and a bag line is capped at MAX_PER_ITEM units.
 */
export function PurchasePanel({ product }: { product: Product }) {
  const oneSize = isOneSize(product);
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0].label : null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const bag = useBag();
  const ids = useId();

  const productStock = totalStock(product);
  const selected = product.sizes.find((s) => s.label === size) ?? null;
  const inBag = size ? quantityInBag(bag, product.slug, size) : 0;
  const maxAddable = selected
    ? Math.max(0, Math.min(selected.stock - inBag, MAX_PER_ITEM - inBag))
    : MAX_PER_ITEM;
  const qty = Math.min(quantity, Math.max(maxAddable, 1));

  const state: StockState = stockState(selected ? selected.stock : productStock);

  // Hide the confirmation after a few seconds.
  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 5000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  function chooseSize(label: string) {
    setSize(label);
    setQuantity(1);
    setError(null);
  }

  function onAdd() {
    setConfirmation(null);
    if (!selected) {
      setError("Please select a size.");
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    if (maxAddable <= 0) return;
    addToBag(product.slug, selected.label, qty);
    setQuantity(1);
    setError(null);
    setConfirmation(
      `Added to your bag: ${product.name}${oneSize ? "" : `, size ${selected.label}`}, quantity ${qty}.`,
    );
  }

  const soldOut = productStock === 0;
  const limitReached = selected !== null && selected.stock > 0 && maxAddable === 0;
  let buttonLabel = "Add to bag";
  if (soldOut) buttonLabel = "Out of stock";
  else if (limitReached) buttonLabel = "Maximum in bag";

  return (
    <div className="flex flex-col gap-8">
      {/* Color */}
      <div className="flex items-center gap-3">
        <span
          className="size-4 rounded-full border"
          style={{ backgroundColor: product.color.hex }}
          aria-hidden="true"
        />
        <p className="type-small">
          <span className="text-muted">Color: </span>
          {product.color.name}
        </p>
      </div>

      {/* Size */}
      {!oneSize && (
        <fieldset ref={sizesRef} aria-describedby={error ? `${ids}-error` : undefined}>
          <legend className="type-title-xs mb-3">
            Size{size && <span className="type-small ml-2 normal-case text-muted">{size}</span>}
          </legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {product.sizes.map((s) => {
              const id = `${ids}-size-${s.label}`;
              const out = s.stock === 0;
              return (
                <div key={s.label} className="relative">
                  <input
                    type="radio"
                    id={id}
                    name={`${ids}-size`}
                    value={s.label}
                    checked={size === s.label}
                    disabled={out}
                    onChange={() => chooseSize(s.label)}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={id}
                    className={cn(
                      "type-small flex h-12 cursor-pointer select-none items-center justify-center border transition-colors",
                      "hover:border-foreground",
                      "peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background",
                      "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                      "peer-disabled:cursor-not-allowed peer-disabled:border-line peer-disabled:bg-subtle peer-disabled:text-muted peer-disabled:line-through",
                    )}
                  >
                    {s.label}
                    {out && <span className="sr-only">, sold out</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Stock state */}
      <StockLine state={state} needsSize={!oneSize && !selected} soldOut={soldOut} />

      {/* Quantity + add */}
      <div className="flex flex-col gap-3">
        {!soldOut && (
          <div className="flex items-center justify-between gap-4">
            <span className="type-title-xs" id={`${ids}-qty-label`}>
              Quantity
            </span>
            <div
              role="group"
              aria-labelledby={`${ids}-qty-label`}
              className="flex h-12 items-center border"
            >
              <button
                type="button"
                className="flex h-full w-12 items-center justify-center disabled:text-muted"
                onClick={() => setQuantity(Math.max(1, qty - 1))}
                disabled={qty <= 1 || maxAddable === 0}
                aria-label="Decrease quantity"
              >
                <span aria-hidden="true">−</span>
              </button>
              <output className="type-small-medium w-10 text-center" aria-live="polite">
                {maxAddable === 0 ? 0 : qty}
              </output>
              <button
                type="button"
                className="flex h-full w-12 items-center justify-center disabled:text-muted"
                onClick={() => setQuantity(Math.min(maxAddable, qty + 1))}
                disabled={qty >= maxAddable}
                aria-label="Increase quantity"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>
        )}

        <Button block onClick={onAdd} disabled={soldOut || limitReached}>
          {buttonLabel}
        </Button>

        <div aria-live="polite" className="min-h-5">
          {error && (
            <p id={`${ids}-error`} className="type-small text-error">
              {error}
            </p>
          )}
          {confirmation && <p className="type-small">{confirmation}</p>}
          {limitReached && !confirmation && (
            <p className="type-small text-muted">
              {inBag >= MAX_PER_ITEM
                ? `You can hold up to ${MAX_PER_ITEM} of this item in your bag.`
                : "All remaining stock in this size is already in your bag."}
            </p>
          )}
          {inBag > 0 && !limitReached && !confirmation && (
            <p className="type-small text-muted">
              {inBag} already in your bag.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StockLine({
  state,
  needsSize,
  soldOut,
}: {
  state: StockState;
  needsSize: boolean;
  soldOut: boolean;
}) {
  let tone = "bg-success";
  let text = "In stock";
  if (soldOut || state.kind === "out-of-stock") {
    tone = "bg-muted";
    text = soldOut ? "Out of stock. This item is currently unavailable." : "Out of stock in this size";
  } else if (needsSize) {
    tone = "bg-success";
    text = "Available. Select a size to check stock.";
  } else if (state.kind === "low-stock") {
    tone = "bg-warning";
    text = state.left === 1 ? "Low stock: only 1 left" : `Low stock: only ${state.left} left`;
  }

  return (
    <p className="type-small flex items-center gap-2" role="status">
      <span className={cn("size-2 shrink-0 rounded-full", tone)} aria-hidden="true" />
      {text}
    </p>
  );
}
