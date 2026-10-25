const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a price stored in cents, e.g. 325000 → "$3,250". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}
