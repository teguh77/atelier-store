"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/cn";

export const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/details", label: "Personal details" },
  { href: "/account/password", label: "Password" },
] as const;

/**
 * Account section menu.
 * Phone and tablet: a row of tabs that scrolls sideways, under the title.
 * Desktop (1024px+): a list in the left column, with sign out below.
 */
export function AccountNav() {
  return <AccountNavView pathname={usePathname()} />;
}

/** The menu. `pathname` is null while a dynamic route prerenders: nothing is marked current. */
export function AccountNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Account">
      <ul className="type-small -mx-gutter flex gap-6 overflow-x-auto px-gutter shadow-[inset_0_-1px_0_var(--line)] [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-4 lg:overflow-visible lg:px-0 lg:shadow-none">
        {ACCOUNT_LINKS.map(({ href, label }) => {
          // Sub-pages (an order's page) keep their section highlighted.
          const current =
            pathname !== null && (pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`)));
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block border-b py-4 lg:inline lg:border-b-0 lg:py-0",
                  current
                    ? "border-foreground text-foreground lg:link-reveal"
                    : "border-transparent text-muted hover:text-foreground lg:link-reveal",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 py-4 lg:mt-4 lg:border-t lg:pt-6 lg:pb-0">
          <SignOutButton appearance="link" className="text-muted hover:text-foreground" />
        </li>
      </ul>
    </nav>
  );
}
