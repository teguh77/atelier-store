import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Personal details" };

export default function AccountDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
      <AccountDetails />
    </Suspense>
  );
}

async function AccountDetails() {
  const { user } = await requireUser("/account/details");

  return (
    <section className="flex max-w-prose-narrow flex-col gap-8 lg:border-t lg:pt-6">
      <h2 className="type-title-xs">Personal details</h2>
      <ProfileForm name={user.name} email={user.email} />
    </section>
  );
}
