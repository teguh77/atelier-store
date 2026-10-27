"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

type SignOutButtonProps = {
  /** "link" matches text navigation, such as the account menu. */
  appearance?: "button" | "link";
  className?: string;
};

/** Ends the session on the server, then leaves the account pages. */
export function SignOutButton({ appearance = "button", className }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const failed = await authClient
      .signOut()
      .then((result) => Boolean(result.error))
      .catch(() => true);
    if (failed) {
      // Still signed in; let them try again rather than pretend it worked.
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const label = pending ? "Signing out" : "Sign out";

  if (appearance === "link") {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className={cn("link-reveal cursor-pointer text-left disabled:cursor-wait", className)}
      >
        {label}
      </button>
    );
  }

  return (
    <Button variant="secondary" onClick={signOut} disabled={pending} className={className}>
      {label}
    </Button>
  );
}
