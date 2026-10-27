import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { TextLink } from "@/components/ui/text-link";
import { formatMonthYear } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your account" };

/* The session is read inside Suspense so the navigation can start before it resolves. */
export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <AccountOverview />
    </Suspense>
  );
}

async function AccountOverview() {
  const { user } = await requireUser("/account");

  return (
    <div className="flex flex-col gap-12">
      <OverviewSection
        title="Personal details"
        action={<TextLink href="/account/details" className="type-small">Edit details</TextLink>}
      >
        <dl className="type-body flex flex-col gap-5">
          <Detail label="Name" value={user.name} />
          <Detail label="Email" value={user.email} />
          <Detail label="Member since" value={formatMonthYear(user.createdAt)} />
        </dl>
      </OverviewSection>

      <OverviewSection
        title="Password"
        action={<TextLink href="/account/password" className="type-small">Change password</TextLink>}
      >
        <p className="type-body text-muted">
          You sign in with your email address and a password.
        </p>
      </OverviewSection>
    </div>
  );
}

function OverviewSection({
  title,
  action,
  children,
}: {
  title: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t pt-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-title-xs">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="type-small text-muted sm:pt-0.5">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
