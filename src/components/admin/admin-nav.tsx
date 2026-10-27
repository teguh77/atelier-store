"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/orders", label: "Orders" },
] as const;

/**
 * Admin top bar. Phone: the section links scroll sideways under the title
 * row, like the account menu. Desktop: one row.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="flex flex-col gap-2 px-gutter pt-5 md:flex-row md:items-center md:gap-10 md:py-5">
        <div className="flex items-center justify-between gap-6">
          <Link href="/admin/products" className="type-small-medium tracking-[0.2em] uppercase">
            Atelier <span className="text-muted">Admin</span>
          </Link>
          <div className="type-small flex gap-6 md:hidden">
            <Link href="/" className="link-reveal text-muted hover:text-foreground">
              Store
            </Link>
            <SignOutButton appearance="link" className="text-muted hover:text-foreground" />
          </div>
        </div>

        <nav aria-label="Admin" className="-mx-gutter min-w-0 flex-1 md:mx-0">
          <ul className="type-small flex gap-6 overflow-x-auto px-gutter [scrollbar-width:none] md:px-0">
            {LINKS.map(({ href, label }) => {
              const current = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block border-b-2 py-3 md:border-b-0 md:py-0",
                      current
                        ? "border-foreground text-foreground md:link-reveal"
                        : "border-transparent text-muted hover:text-foreground md:link-reveal",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="type-small hidden gap-6 md:flex">
          <Link href="/" className="link-reveal text-muted hover:text-foreground">
            View store
          </Link>
          <SignOutButton appearance="link" className="text-muted hover:text-foreground" />
        </div>
      </div>
    </header>
  );
}
