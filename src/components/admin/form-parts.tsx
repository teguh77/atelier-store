"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { FormStatus } from "@/components/account/form-status";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { AdminActionResult } from "@/lib/admin/schemas";
import { cn } from "@/lib/cn";

/*
 * Form pieces shared by the admin forms. Inputs are uncontrolled with
 * defaultValue; forms submit through onSubmit + startTransition (not the
 * `action` prop) so React doesn't reset what the admin typed when the server
 * returns validation errors.
 */

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "children"> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ name, label, error, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? `admin-${name}`;
  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      {(describedBy) => (
        <input
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("field-input", className)}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  rows = 4,
  ...props
}: Omit<ComponentPropsWithoutRef<"textarea">, "children"> & { name: string; label: string; error?: string; hint?: string }) {
  const id = `admin-${name}`;
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(describedBy) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="field-input resize-y"
          {...props}
        />
      )}
    </Field>
  );
}

export function SelectField({
  name,
  label,
  error,
  children,
  ...props
}: ComponentPropsWithoutRef<"select"> & { name: string; label: string; error?: string; children: ReactNode }) {
  const id = `admin-${name}`;
  return (
    <Field id={id} label={label} error={error}>
      {(describedBy) => (
        <select
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="field-input cursor-pointer"
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ label, hint, ...props }: ComponentPropsWithoutRef<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-1 size-4 shrink-0 cursor-pointer accent-foreground" {...props} />
      <span className="flex flex-col gap-1">
        <span className="type-small-medium">{label}</span>
        {hint && <span className="type-small text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** A titled group of fields. */
export function FormSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-6 border-t pt-6", className)}>
      <legend className="type-title-xs float-left mb-2 w-full">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Save button plus the result line, from the action's result. */
export function SubmitRow({
  label,
  pendingLabel,
  pending,
  result,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  result: AdminActionResult;
}) {
  const status = pending
    ? ({ kind: "pending" } as const)
    : result.message
      ? ({ kind: result.ok ? "success" : "error", message: result.message } as const)
      : ({ kind: "idle" } as const);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <Button type="submit" block="mobile" aria-busy={pending || undefined} className={pending ? "cursor-wait" : undefined}>
        {pending && <Spinner />}
        {pending ? pendingLabel : label}
      </Button>
      <FormStatus status={status} />
    </div>
  );
}
