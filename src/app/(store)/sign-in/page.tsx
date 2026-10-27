import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Sign in" };

/* The `next` parameter is read inside Suspense, as on the product page. */
export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <Suspense fallback={<div className="pt-header min-h-[70vh]" aria-busy="true" />}>
      <AuthScreen mode="sign-in" searchParams={searchParams} />
    </Suspense>
  );
}
