"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { validateField } from "@/components/auth/validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

import { FormStatus, serverErrorMessage, type Status } from "./form-status";

type ProfileFormProps = {
  name: string;
  email: string;
};

/** Edit the customer's name. The email is shown but can't be changed here. */
export function ProfileForm({ name: savedName, email }: ProfileFormProps) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(savedName);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const pending = status.kind === "pending";
  const unchanged = name.trim() === savedName.trim();

  function onChange(value: string) {
    setName(value);
    if (status.kind !== "pending") setStatus({ kind: "idle" });
    if (error) setError(validateField("sign-up", "name", value));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || unchanged) return;

    const problem = validateField("sign-up", "name", name);
    setError(problem);
    if (problem) {
      input.current?.focus();
      return;
    }

    setStatus({ kind: "pending" });
    const result = await authClient.updateUser({ name: name.trim() }).catch(() => ({ error: { status: 0 } }));
    if (result.error) {
      setStatus({ kind: "error", message: serverErrorMessage(result.error) });
      return;
    }
    setName(name.trim());
    setStatus({ kind: "success", message: "Your details have been saved." });
    // Refresh the server-rendered parts (greeting, overview) with the new name.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8" aria-busy={pending}>
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-8">
        <Field id={`${id}-name`} label="Name" error={error}>
          {(describedBy) => (
            <input
              ref={input}
              id={`${id}-name`}
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => name !== savedName && setError(validateField("sign-up", "name", name))}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>
      </fieldset>

      <div className="flex flex-col gap-2">
        <p className="type-title-xs">Email address</p>
        <p className="type-body break-all py-3">{email}</p>
        <p className="type-small text-muted">
          You use this email to sign in. It can&apos;t be changed online yet.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Button type="submit" block="mobile" disabled={unchanged && !pending} aria-busy={pending || undefined}>
            {pending && <Spinner />}
            {pending ? "Saving" : "Save changes"}
          </Button>
        </div>
        <FormStatus status={status} />
      </div>
    </form>
  );
}
