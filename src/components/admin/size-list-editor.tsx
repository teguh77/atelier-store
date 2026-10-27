"use client";

import { useId, useState } from "react";

import { ONE_SIZE } from "@/lib/products";
import { cn } from "@/lib/cn";

import { Checkbox } from "./form-parts";

type ExistingSize = { id: number; sizeLabel: string; quantity: number };

/**
 * Sizes for the product form.
 * - Existing sizes (edit) can be kept or removed, not renamed: order items
 *   refer to sizes by name. Their stock is edited in the Stock section.
 * - New sizes get a name and a starting stock.
 * - "One size" replaces the list with a single row.
 * Submits keepSizeId / sizeLabel / sizeQty / oneSize / oneSizeQty, read by
 * parseSizes in src/lib/admin/schemas.ts.
 */
export function SizeListEditor({ existing = [], error }: { existing?: ExistingSize[]; error?: string }) {
  const id = useId();
  const existingOneSize = existing.find((s) => s.sizeLabel === ONE_SIZE);
  const sized = existing.filter((s) => s.sizeLabel !== ONE_SIZE);

  const [oneSize, setOneSize] = useState(existing.length > 0 ? Boolean(existingOneSize) : false);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<{ key: number; label: string; qty: string }[]>(
    existing.length === 0 ? [{ key: 0, label: "", qty: "0" }] : [],
  );
  const [nextKey, setNextKey] = useState(1);

  function toggleRemoved(sizeId: number) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(sizeId)) next.delete(sizeId);
      else next.add(sizeId);
      return next;
    });
  }

  function addRow() {
    setAdded((rows) => [...rows, { key: nextKey, label: "", qty: "0" }]);
    setNextKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6" aria-describedby={error ? `${id}-error` : undefined}>
      <Checkbox
        name="oneSize"
        label="One size"
        hint="For bags, jewelry and accessories without sizes."
        checked={oneSize}
        onChange={(e) => setOneSize(e.target.checked)}
      />

      {oneSize ? (
        existingOneSize ? (
          <>
            <input type="hidden" name="keepSizeId" value={existingOneSize.id} />
            <p className="type-small text-muted">
              {existingOneSize.quantity} in stock. Change it in the Stock section below.
            </p>
          </>
        ) : (
          <label className="flex max-w-48 flex-col gap-2">
            <span className="type-small text-muted">Starting stock</span>
            <input name="oneSizeQty" type="number" min={0} max={9999} defaultValue={0} className="field-input" />
          </label>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {sized.length > 0 && (
            <ul className="flex flex-col divide-y border-y">
              {sized.map((s) => {
                const isRemoved = removed.has(s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                    {!isRemoved && <input type="hidden" name="keepSizeId" value={s.id} />}
                    <span className={cn("type-small-medium", isRemoved && "text-muted line-through")}>
                      {s.sizeLabel}
                      <span className="type-small ml-3 text-muted no-underline">{s.quantity} in stock</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRemoved(s.id)}
                      className="type-small link-underline cursor-pointer"
                    >
                      {isRemoved ? "Undo" : "Remove"}
                      <span className="sr-only"> size {s.sizeLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {added.map((row, i) => (
            <div key={row.key} className="flex items-end gap-4">
              <label className="flex flex-1 flex-col gap-2">
                <span className="type-small text-muted">New size</span>
                <input
                  name="sizeLabel"
                  value={row.label}
                  maxLength={20}
                  placeholder="e.g. M or 38"
                  onChange={(e) => setAdded((rows) => rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
                  className="field-input"
                />
              </label>
              <label className="flex w-28 flex-col gap-2">
                <span className="type-small text-muted">Stock</span>
                <input
                  name="sizeQty"
                  type="number"
                  min={0}
                  max={9999}
                  value={row.qty}
                  onChange={(e) => setAdded((rows) => rows.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))}
                  className="field-input"
                />
              </label>
              <button
                type="button"
                onClick={() => setAdded((rows) => rows.filter((_, j) => j !== i))}
                className="type-small link-underline mb-3 cursor-pointer"
              >
                Remove<span className="sr-only"> new size {row.label}</span>
              </button>
            </div>
          ))}

          <button type="button" onClick={addRow} className="type-small link-underline cursor-pointer self-start">
            Add a size
          </button>
          {removed.size > 0 && (
            <p className="type-small text-muted">
              Removed sizes disappear from the store when you save. Their stock is deleted.
            </p>
          )}
        </div>
      )}

      {error && (
        <p id={`${id}-error`} className="type-small text-error">
          {error}
        </p>
      )}
    </div>
  );
}
