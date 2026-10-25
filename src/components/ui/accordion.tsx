import type { ReactNode } from "react";

type AccordionItemProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Expandable section built on <details>: works without JavaScript. */
export function AccordionItem({ title, defaultOpen = false, children }: AccordionItemProps) {
  return (
    <details className="group border-b" open={defaultOpen}>
      <summary className="type-title-xs flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        {title}
        <span
          className="relative size-3 shrink-0 transition-transform duration-300 group-open:rotate-45"
          aria-hidden="true"
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
