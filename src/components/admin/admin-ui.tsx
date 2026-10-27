import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/*
 * Small building blocks shared by the admin pages. Server components, tokens only.
 */

/** Page title row: caption, title and an optional action on the right. */
export function AdminPageHeader({
  caption,
  title,
  action,
  children,
}: {
  caption?: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {caption && <p className="type-caption text-muted">{caption}</p>}
        <h1 className="type-title-l">{title}</h1>
        {children}
      </div>
      {action}
    </header>
  );
}

/**
 * A data table. Scrolls sideways inside its own box on narrow screens so the
 * page itself never does. `relative` keeps the absolutely positioned
 * sr-only labels inside the scroll box; without it they widen the page.
 */
export function AdminTable({ label, children, minWidth = "min-w-[44rem]" }: { label: string; children: ReactNode; minWidth?: string }) {
  return (
    <div className="relative -mx-gutter overflow-x-auto px-gutter" role="region" aria-label={label} tabIndex={0}>
      <table
        className={cn(
          "type-small w-full border-collapse text-left",
          "[&_th]:type-caption [&_th]:border-b [&_th]:py-3 [&_th]:pr-6 [&_th]:font-normal [&_th]:text-muted [&_th:last-child]:pr-0",
          "[&_td]:border-b [&_td]:py-4 [&_td]:pr-6 [&_td]:align-middle [&_td:last-child]:pr-0",
          minWidth,
        )}
      >
        {children}
      </table>
    </div>
  );
}

/** Dot + text, the same style as stock notes on the storefront. */
export function StockBadge({ quantity, low }: { quantity: number; low: number }) {
  if (quantity === 0) return <Dot tone="bg-error">Sold out</Dot>;
  if (quantity <= low) return <Dot tone="bg-warning">{quantity} left</Dot>;
  return <span className="tabular-nums">{quantity}</span>;
}

export function Dot({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className={cn("size-2 shrink-0 rounded-full", tone)} aria-hidden="true" />
      {children}
    </span>
  );
}

/** A row of filter links (status, category…). The current one is underlined. */
export function FilterLinks({ label, items }: { label: string; items: { href: string; label: string; current: boolean }[] }) {
  return (
    <nav aria-label={label}>
      <ul className="type-small flex flex-wrap gap-x-6 gap-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn("link-reveal", item.current ? "text-foreground" : "text-muted hover:text-foreground")}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const LOADING = <div className="min-h-[50vh]" aria-busy="true" />;

/** Confirmation banner after a redirect (e.g. "Product created"). */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="type-small border-l-2 border-success py-1 pl-4">
      {children}
    </p>
  );
}
