"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

import {
  PASSWORD_MIN,
  fieldsFor,
  mapServerError,
  validateAll,
  validateField,
  type AuthMode,
  type FieldErrors,
  type FieldName,
  type FieldValues,
} from "./validation";

type AuthFormProps = {
  mode: AuthMode;
  /** Same-site path to open after signing in. */
  next: string;
};

type FormError = { message: string; offerSignIn?: boolean };

/**
 * Sign-in and sign-up with email and password, through Better Auth.
 *
 * Validation: each field is checked when it loses focus, then live while it
 * shows an error. Submitting checks everything and focuses the first problem.
 * Server errors appear next to the field they concern, or above the button.
 */
export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const id = useId();

  const [values, setValues] = useState<FieldValues>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const errorBox = useRef<HTMLDivElement>(null);

  function setFieldError(field: FieldName, message: string | undefined) {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }

  function onChange(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear an error as soon as the value is fixed; don't add new ones while typing.
    if (errors[field]) setFieldError(field, validateField(mode, field, value));
  }

  function onBlur(field: FieldName) {
    // Leaving an empty field untouched isn't an error yet.
    if (!values[field] && !errors[field]) return;
    setFieldError(field, validateField(mode, field, values[field]));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const found = validateAll(mode, values);
    setErrors(found);
    setFormError(null);
    const firstInvalid = fieldsFor(mode).find((field) => found[field]);
    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus();
      return;
    }

    setPending(true);
    const email = values.email.trim();
    let error: { code?: string; status?: number; message?: string } | null;
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: values.name.trim(), email, password: values.password })
        : await authClient.signIn.email({ email, password: values.password });
      error = result.error;
    } catch {
      error = { status: 0 };
    }

    if (!error) {
      // Stay in the loading state until the next page replaces this one.
      router.replace(next);
      router.refresh();
      return;
    }

    setPending(false);
    const mapped = mapServerError(error);
    if (mapped.kind === "field") {
      setFieldError(mapped.field, mapped.message);
      requestAnimationFrame(() => inputs.current[mapped.field]?.focus());
      return;
    }
    setFormError({ message: mapped.message, offerSignIn: mapped.offerSignIn });
    if (!isSignUp) setValues((prev) => ({ ...prev, password: "" }));
    requestAnimationFrame(() => errorBox.current?.focus());
  }

  const switchHref = `${isSignUp ? "/sign-in" : "/sign-up"}?next=${encodeURIComponent(next)}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8" aria-busy={pending}>
      {formError && (
        <div
          ref={errorBox}
          tabIndex={-1}
          role="alert"
          className="type-small flex flex-col gap-2 border-l-2 border-error py-1 pl-4 outline-none"
        >
          <p>{formError.message}</p>
          {formError.offerSignIn && (
            <p>
              <Link href={signInHref} className="link-underline">
                Sign in instead
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Disabling the fieldset locks every input while the request runs. */}
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-8">
        {isSignUp && (
          <Field
            id={`${id}-name`}
            label="Name"
            error={errors.name}
          >
            {(describedBy) => (
              <input
                ref={(el) => {
                  inputs.current.name = el;
                }}
                id={`${id}-name`}
                type="text"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={(e) => onChange("name", e.target.value)}
                onBlur={() => onBlur("name")}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy}
                className="field-input"
              />
            )}
          </Field>
        )}

        <Field id={`${id}-email`} label="Email address" error={errors.email}>
          {(describedBy) => (
            <input
              ref={(el) => {
                inputs.current.email = el;
              }}
              id={`${id}-email`}
              type="email"
              name="email"
              inputMode="email"
              autoComplete={isSignUp ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@example.com"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              onBlur={() => onBlur("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>

        <Field
          id={`${id}-password`}
          label="Password"
          error={errors.password}
          hint={isSignUp ? `At least ${PASSWORD_MIN} characters.` : undefined}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-controls={`${id}-password`}
              aria-pressed={showPassword}
              className="type-small link-reveal cursor-pointer text-muted hover:text-foreground disabled:cursor-not-allowed"
            >
              {showPassword ? "Hide" : "Show"}
              <span className="sr-only"> password</span>
            </button>
          }
        >
          {(describedBy) => (
            <input
              ref={(el) => {
                inputs.current.password = el;
              }}
              id={`${id}-password`}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              autoCapitalize="none"
              spellCheck={false}
              value={values.password}
              onChange={(e) => onChange("password", e.target.value)}
              onBlur={() => onBlur("password")}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>
      </fieldset>

      <div className="flex flex-col gap-6">
        {/* Not `disabled` while loading, so the button keeps its black fill. */}
        <Button type="submit" block aria-busy={pending || undefined}>
          {pending && <Spinner />}
          {pending
            ? isSignUp
              ? "Creating account"
              : "Signing in"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
        <p className="type-small text-muted">
          {isSignUp ? "Already have an account? " : "New to Atelier? "}
          <Link href={switchHref} className="link-underline text-foreground">
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </form>
  );
}
