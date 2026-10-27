"use client";

import { cn } from "@/lib/cn";

type QuantityStepperProps = {
  value: number;
  /** Highest value the + button allows. */
  max: number;
  min?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** id of the visible label, or use `label` for a hidden one. */
  labelledBy?: string;
  label?: string;
  /** Compact 40px height for list rows; default is 48px. */
  compact?: boolean;
};

/** − value + control with a hairline box. The value is announced politely. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
  labelledBy,
  label,
  compact = false,
}: QuantityStepperProps) {
  const button = cn(
    "flex h-full items-center justify-center disabled:cursor-not-allowed disabled:text-muted",
    compact ? "w-10" : "w-12",
  );

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={cn("flex items-center border", compact ? "h-10" : "h-12")}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <span aria-hidden="true">−</span>
      </button>
      <output className={cn("type-small-medium text-center", compact ? "w-8" : "w-10")} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
