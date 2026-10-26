import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "glass";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  /** Full width. Use "mobile" for full width on phones, auto from 768px. */
  block?: boolean | "mobile";
};

function buttonClass({ variant = "primary", block }: ButtonStyleProps) {
  return cn(
    "btn",
    variant === "secondary" && "btn-secondary",
    variant === "glass" && "btn-glass",
    block === true && "btn-block",
    block === "mobile" && "btn-block md:w-auto",
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & ButtonStyleProps;

export function Button({
  variant,
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, block }), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & ButtonStyleProps;

/** A link that looks like a button. */
export function ButtonLink({
  variant,
  block,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClass({ variant, block }), className)} {...props} />
  );
}
