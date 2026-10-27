import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSession, safeRedirect } from "@/lib/session";

type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const COPY = {
  "sign-in": {
    title: "Sign in",
    intro: "Welcome back. Sign in with your email and password.",
  },
  "sign-up": {
    title: "Create account",
    intro: "Create an account to keep your details in one place.",
  },
} as const;

/** Centered sign-in or sign-up panel. Reads `next` from the URL. */
export async function AuthScreen({ mode, searchParams }: AuthScreenProps) {
  const [{ next }, session] = await Promise.all([searchParams, getSession()]);
  const target = safeRedirect(next, "/account");

  // Already signed in: skip the form and go where they were heading.
  if (session) redirect(target);

  const copy = COPY[mode];

  return (
    <div className="pt-header">
      <div className="mx-auto flex max-w-panel flex-col gap-10 px-gutter py-12 md:box-content md:py-20">
        <header className="flex flex-col gap-3">
          <p className="type-caption text-muted">Account</p>
          <h1 className="type-title-l">{copy.title}</h1>
          <p className="type-small text-muted">{copy.intro}</p>
        </header>
        <AuthForm mode={mode} next={target} />
      </div>
    </div>
  );
}
