import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

type TextLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  /**
   * underline: line at rest, wipes on hover (inline links in copy).
   * reveal: no line at rest, draws in on hover (navigation).
   * cta: small call-to-action link next to imagery.
   */
  variant?: "underline" | "reveal" | "cta";
};

// Full class names written out so Tailwind can find them.
const variantClass = {
  underline: "link-underline",
  reveal: "link-reveal",
  cta: "link-cta",
} as const;

export function TextLink({
  variant = "underline",
  className,
  ...props
}: TextLinkProps) {
  return <Link className={cn(variantClass[variant], className)} {...props} />;
}
