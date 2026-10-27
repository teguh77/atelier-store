import type { ShippingAddress as Address } from "@/db/schema";

/** A shipping name and address as Stripe reported them, one line each. */
export function ShippingAddress({ name, address }: { name: string | null; address: Address | null }) {
  const cityLine = [address?.city, [address?.state, address?.postalCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const lines = [name, address?.line1, address?.line2, cityLine, address?.country].filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <address className="not-italic">
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}
