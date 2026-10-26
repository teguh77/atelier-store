import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/cn";

type ContainerProps<T extends ElementType> = {
  as?: T;
  /** Full width with gutters only, no 1440px cap (e.g. product grids, heroes). */
  bleed?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** Page column: centered, max 1440px, responsive side gutters. */
export function Container<T extends ElementType = "div">({
  as,
  bleed = false,
  className,
  ...props
}: ContainerProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={cn(bleed ? "w-full px-gutter" : "page-container", className)}
      {...props}
    />
  );
}

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  bleed?: boolean;
  /** Inverse colors (white on black) for this band. */
  inverse?: boolean;
};

/** Page section with the standard vertical rhythm (48 / 64 / 96px). */
export function Section({
  bleed = false,
  inverse = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-section", inverse && "theme-inverse", className)}
      {...props}
    >
      <Container bleed={bleed}>{children}</Container>
    </section>
  );
}
