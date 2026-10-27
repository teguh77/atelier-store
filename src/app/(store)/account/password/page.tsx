import type { Metadata } from "next";

import { PasswordForm } from "@/components/account/password-form";

export const metadata: Metadata = { title: "Password" };

/* No session data needed here; the account layout already guards the page. */
export default function AccountPasswordPage() {
  return (
    <section className="flex max-w-prose-narrow flex-col gap-8 lg:border-t lg:pt-6">
      <div className="flex flex-col gap-3">
        <h2 className="type-title-xs">Change password</h2>
        <p className="type-small text-muted">
          Enter your current password, then choose a new one.
        </p>
      </div>
      <PasswordForm />
    </section>
  );
}
