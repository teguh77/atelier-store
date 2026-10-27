"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";

import { Spinner } from "@/components/ui/spinner";
import { adjustStockLevel, updateStock, type StockActionResult } from "@/lib/admin/actions/stock";
import { cn } from "@/lib/cn";

const IDLE: StockActionResult = { ok: false };

type Props = { stockId: number; quantity: number; label: string };

/**
 * Stock controls for one size:
 * - Set to N: sends the count this page showed; refused if a sale changed it since.
 * - Adjust by ±N: for restocks and write-offs; applied atomically, never below 0.
 * After any save the page refreshes, so `quantity` is always the latest count.
 */
export function StockRowForm({ stacked = false, ...props }: Props & { /** Always one form above the other (narrow panels). */ stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col gap-3" : "flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-8"}>
      <SetStockForm {...props} />
      <AdjustStockForm {...props} />
    </div>
  );
}

function SetStockForm({ stockId, quantity, label }: Props) {
  const [result, dispatch, pending] = useActionState(updateStock, IDLE);
  const [value, setValue] = useState(String(quantity));
  // The count this form last saw, to notice when a refresh brings a new one.
  const [seen, setSeen] = useState(quantity);
  const [changedTo, setChangedTo] = useState<number | null>(null);

  if (seen !== quantity) {
    setSeen(quantity);
    const typed = value.trim();
    if (typed === String(seen)) {
      // Untouched: follow the new count, so Save can't write back an old one.
      setValue(String(quantity));
    } else if (typed !== String(quantity)) {
      // Edited: keep what the admin typed, but say the stock moved.
      setChangedTo(quantity);
    }
  }

  const unchanged = value.trim() === String(quantity);
  const id = `stock-set-${stockId}`;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || unchanged) return;
    setChangedTo(null);
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  const message = pending
    ? ""
    : changedTo !== null
      ? `Stock is now ${changedTo}. Save to replace it with ${value.trim()}.`
      : (result.message ?? "");
  const tone = changedTo !== null || (result.current !== undefined && !result.ok) ? "text-warning" : result.ok ? "text-success" : "text-error";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <input type="hidden" name="stockId" value={stockId} />
      {/* What this page shows now; the server refuses the save if stock differs. */}
      <input type="hidden" name="expected" value={quantity} />
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="type-small whitespace-nowrap text-muted">
          Set to<span className="sr-only"> (stock for {label})</span>
        </label>
        <input
          id={id}
          name="quantity"
          type="number"
          min={0}
          max={9999}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setChangedTo(null);
          }}
          aria-invalid={!result.ok && result.message && result.current === undefined ? true : undefined}
          aria-describedby={message ? `${id}-message` : undefined}
          className="field-input min-h-10 w-20 py-1.5 tabular-nums"
        />
        <SubmitLink pending={pending} disabled={unchanged && !pending} label="Save" srLabel={`stock for ${label}`} />
      </div>
      <p id={`${id}-message`} role="status" className={cn("type-small max-w-64", !message && "sr-only", tone)}>
        {message}
      </p>
    </form>
  );
}

function AdjustStockForm({ stockId, label }: Props) {
  const [result, dispatch, pending] = useActionState(adjustStockLevel, IDLE);
  const [delta, setDelta] = useState("");
  const [handled, setHandled] = useState(result);
  const id = `stock-adjust-${stockId}`;

  // Clear the amount once it has been applied.
  if (handled !== result) {
    setHandled(result);
    if (result.ok) setDelta("");
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || delta.trim() === "") return;
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  const message = pending ? "" : (result.message ?? "");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <input type="hidden" name="stockId" value={stockId} />
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="type-small whitespace-nowrap text-muted">
          Adjust<span className="sr-only"> stock for {label} by</span>
        </label>
        <input
          id={id}
          name="delta"
          type="text"
          inputMode="numeric"
          placeholder="+5 / -2"
          autoComplete="off"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          aria-invalid={!result.ok && result.message ? true : undefined}
          aria-describedby={message ? `${id}-message` : undefined}
          className="field-input min-h-10 w-20 py-1.5 tabular-nums"
        />
        <SubmitLink pending={pending} disabled={delta.trim() === "" && !pending} label="Apply" srLabel={`adjustment for ${label}`} />
      </div>
      <p
        id={`${id}-message`}
        role="status"
        className={cn("type-small max-w-64", !message && "sr-only", result.ok ? "text-success" : "text-error")}
      >
        {message}
      </p>
    </form>
  );
}

function SubmitLink({ pending, disabled, label, srLabel }: { pending: boolean; disabled: boolean; label: string; srLabel: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={pending || undefined}
      className="type-small link-underline inline-flex cursor-pointer items-center gap-2 disabled:cursor-default disabled:bg-none disabled:text-muted"
    >
      {pending && <Spinner />}
      {pending ? "Saving" : label}
      <span className="sr-only"> {srLabel}</span>
    </button>
  );
}
