"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

/**
 * Newsletter sign-up. Not connected to a mailing service yet: it only
 * checks the address and shows a confirmation on the page.
 */
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (e.currentTarget.checkValidity()) setDone(true);
  }

  if (done) {
    return (
      <p className="type-body" role="status">
        Thank you. You&apos;ll hear from us soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 md:flex-row md:items-end">
      <label className="flex flex-1 flex-col gap-2">
        <span className="type-title-xs">Email address</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          className="field-input"
        />
      </label>
      <Button type="submit" variant="secondary" block="mobile">
        Sign up
      </Button>
    </form>
  );
}
