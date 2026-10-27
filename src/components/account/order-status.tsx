import type { CustomerOrder } from "@/lib/account-orders";
import { cn } from "@/lib/cn";

type Status = CustomerOrder["paymentStatus"];

// Full class names written out so Tailwind can find them.
const STATUS: Record<Status, { label: string; tone: string }> = {
  paid: { label: "Paid", tone: "bg-success" },
  processing: { label: "Payment processing", tone: "bg-warning" },
  pending: { label: "Awaiting payment", tone: "bg-muted" },
  failed: { label: "Payment failed", tone: "bg-error" },
  expired: { label: "Not completed", tone: "bg-muted" },
};

/** Payment status as a dot + label, in the same style as stock notes. */
export function OrderStatus({ status, className }: { status: Status; className?: string }) {
  const { label, tone } = STATUS[status];
  return (
    <span className={cn("type-small inline-flex items-center gap-2", className)}>
      <span className={cn("size-2 shrink-0 rounded-full", tone)} aria-hidden="true" />
      {label}
    </span>
  );
}
