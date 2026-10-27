"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { PASSWORD_MAX, PASSWORD_MIN } from "@/components/auth/validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

import { FormStatus, serverErrorMessage, type Status } from "./form-status";

type FieldName = "current" | "next";
type Errors = Partial<Record<FieldName, string>>;

function validate(field: FieldName, values: Record<FieldName, string>): string | undefined {
  const value = values[field];
  if (field === "current") return value ? undefined : "Enter your current password.";
  if (!value) return "Choose a new password.";
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
  if (value === values.current) return "Choose a password different from your current one.";
  return undefined;
}

/** Change password, optionally signing out every other device. */
export function PasswordForm() {
  const id = useId();
  const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});

  const [values, setValues] = useState<Record<FieldName, string>>({ current: "", next: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [show, setShow] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pending = status.kind === "pending";

  function onChange(field: FieldName, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (status.kind !== "pending") setStatus({ kind: "idle" });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(field, nextValues) }));
  }

  function onBlur(field: FieldName) {
    if (!values[field] && !errors[field]) return;
    setErrors((prev) => ({ ...prev, [field]: validate(field, values) }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const found: Errors = { current: validate("current", values), next: validate("next", values) };
    setErrors(found);
    const first = (["current", "next"] as const).find((field) => found[field]);
    if (first) {
      inputs.current[first]?.focus();
      return;
    }

    setStatus({ kind: "pending" });
    const result = await authClient
      .changePassword({
        currentPassword: values.current,
        newPassword: values.next,
        revokeOtherSessions: signOutOthers,
      })
      .catch(() => ({ error: { status: 0, code: undefined } }));

    if (result.error) {
      const { code } = result.error;
      if (code === "INVALID_PASSWORD") {
        setStatus({ kind: "idle" });
        setErrors({ current: "That isn't your current password." });
        requestAnimationFrame(() => inputs.current.current?.focus());
        return;
      }
      if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        setStatus({ kind: "idle" });
        setErrors({ next: validate("next", values) ?? `Use ${PASSWORD_MIN}–${PASSWORD_MAX} characters.` });
        requestAnimationFrame(() => inputs.current.next?.focus());
        return;
      }
      setStatus({ kind: "error", message: serverErrorMessage(result.error) });
      return;
    }

    setValues({ current: "", next: "" });
    setShow(false);
    setStatus({
      kind: "success",
      message: signOutOthers
        ? "Your password has been changed and your other devices are signed out."
        : "Your password has been changed.",
    });
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-pressed={show}
      className="type-small link-reveal cursor-pointer text-muted hover:text-foreground disabled:cursor-not-allowed"
    >
      {show ? "Hide" : "Show"}
      <span className="sr-only"> passwords</span>
    </button>
  );

  function passwordInput(field: FieldName, autoComplete: string, describedBy: string | undefined) {
    return (
      <input
        ref={(el) => {
          inputs.current[field] = el;
        }}
        id={`${id}-${field}`}
        type={show ? "text" : "password"}
        name={field === "current" ? "current-password" : "new-password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        value={values[field]}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy}
        className="field-input"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8" aria-busy={pending}>
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-8">
        <Field id={`${id}-current`} label="Current password" error={errors.current} action={toggle}>
          {(describedBy) => passwordInput("current", "current-password", describedBy)}
        </Field>
        <Field
          id={`${id}-next`}
          label="New password"
          error={errors.next}
          hint={`At least ${PASSWORD_MIN} characters.`}
        >
          {(describedBy) => passwordInput("next", "new-password", describedBy)}
        </Field>

        <label className="type-small flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={signOutOthers}
            onChange={(e) => setSignOutOthers(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-foreground"
          />
          <span>
            Sign out of all other devices
            <span className="block text-muted">Recommended if you think someone else knows your password.</span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-col gap-4">
        <div>
          <Button type="submit" block="mobile" aria-busy={pending || undefined}>
            {pending && <Spinner />}
            {pending ? "Updating" : "Update password"}
          </Button>
        </div>
        <FormStatus status={status} />
      </div>
    </form>
  );
}
