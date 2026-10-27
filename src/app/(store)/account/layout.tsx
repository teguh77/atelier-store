import type { ReactNode } from "react";
import { Suspense } from "react";

import { AccountNav, AccountNavView } from "@/components/account/account-nav";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/session";

/*
 * Signed-in customers only. The proxy redirects first; this is the server check.
 * The shell (title + menu) lives here so it stays put while moving between
 * account pages. Only the greeting needs the session.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-header">
      <Container className="flex flex-col gap-8 py-12 md:py-16 lg:grid lg:grid-cols-12 lg:gap-x-grid lg:gap-y-12">
        <header className="flex flex-col gap-3 lg:col-span-12">
          <p className="type-caption text-muted">Account</p>
          <Suspense fallback={<h1 className="type-title-l">Your account</h1>}>
            <Greeting />
          </Suspense>
        </header>

        <div className="lg:col-span-3">
          {/* Reads the URL: Suspense lets /account/orders/[number] prerender. */}
          <Suspense fallback={<AccountNavView pathname={null} />}>
            <AccountNav />
          </Suspense>
        </div>

        <div className="min-w-0 lg:col-span-8 lg:col-start-5">
          <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
            <AccountGuard>{children}</AccountGuard>
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

async function Greeting() {
  const { user } = await requireUser("/account");
  const firstName = user.name.trim().split(/\s+/)[0];
  return <h1 className="type-title-l">{firstName ? `Hello, ${firstName}` : "Your account"}</h1>;
}

async function AccountGuard({ children }: { children: ReactNode }) {
  await requireUser("/account");
  return children;
}
