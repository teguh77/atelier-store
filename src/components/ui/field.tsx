import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type FieldProps = {
  /** id of the input, so the label points at it. */
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Small control shown at the right of the label, such as Show/Hide. */
  action?: ReactNode;
  /** Renders the input. Pass `describedBy` to its aria-describedby. */
  children: (describedBy: string | undefined) => ReactNode;
};

/**
 * Form field: label, input, then either the error or the hint below it.
 * Set aria-invalid on the input when there is an error; `field-input`
 * turns its underline red.
 */
export function Field({ id, label, error, hint, action, children }: FieldProps) {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-title-xs">
          {label}
        </label>
        {action}
      </div>
      {children(message ? messageId : undefined)}
      {message && (
        <p id={messageId} className={cn("type-small", error ? "text-error" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}
