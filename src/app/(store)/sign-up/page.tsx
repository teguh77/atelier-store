import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Create account" };

/* The `next` parameter is read inside Suspense, as on the product page. */
export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <AuthScreen mode="sign-up" searchParams={searchParams} />
    </Suspense>
  );
}
