import { getCart } from "@/lib/cart/build";

/*
 * Header bag badge. Uses the same stock-checked cart as the bag page, so the
 * two always agree. An empty cart skips the database entirely, and on /bag
 * the lookup is shared with the page (getCart is cached per request).
 *
 * It's on every page, so a failed lookup (e.g. a dropped connection to the
 * database) must not take the page down: the badge is left out and the real
 * cause is logged. Drizzle's "Failed query" message hides it in `cause`.
 */
export async function BagCount() {
  let count: number;
  try {
    ({ count } = await getCart());
  } catch (error) {
    const cause = (error as Error).cause as Error | undefined;
    console.error("[bag-count] Couldn't load the bag:", cause?.message ?? (error as Error).message);
    return null;
  }

  return (
    <>
      <span className="sr-only">, {count} {count === 1 ? "item" : "items"}</span>
      {count > 0 && (
        <span
          className="type-caption absolute right-1 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 leading-4 text-background"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </>
  );
}
