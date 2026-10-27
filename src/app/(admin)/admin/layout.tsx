import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Atelier" },
  robots: { index: false },
};

/*
 * Admins only. Everyone else gets the 404 page. Checks happen in layers:
 * the proxy, this layout, every admin query (src/lib/admin/queries.ts) and
 * every admin action (assertAdmin in src/lib/admin/actions/*).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

async function AdminGuard({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <main id="main" className="mx-auto flex w-full max-w-page flex-col gap-10 px-gutter py-10 md:py-12">
        {children}
      </main>
    </>
  );
}
