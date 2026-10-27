const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a price stored in cents, e.g. 325000 → "$3,250". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}

const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const longDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Formats a date in full, e.g. "October 27, 2026". */
export function formatDate(date: Date | string) {
  return longDate.format(new Date(date));
}

/** Formats a date as month and year, e.g. "October 2026". */
export function formatMonthYear(date: Date | string) {
  return monthYear.format(new Date(date));
}

/** Customer-facing order number, e.g. 1042 → "AT-001042". */
export function formatOrderNumber(n: number) {
  return `AT-${String(n).padStart(6, "0")}`;
}
