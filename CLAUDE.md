# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Atelier Store is a luxury fashion store: storefront, cookie bag, Stripe-hosted checkout, customer accounts and an admin area. Visual direction: black on white, large editorial imagery, small uppercase UI text, square corners.

Stack: Next.js 16 (App Router, Cache Components on), React 19, TypeScript, Tailwind CSS v4 (configured in CSS), Better Auth, Drizzle ORM on Neon Postgres, Stripe. Next 16 differs from older versions, so read `node_modules/next/dist/docs/` before writing Next code. For example, `priority` is now `preload`, `middleware` is now `proxy.ts`, and `dynamicParams` isn't available with Cache Components.

## Commands

Node 24 (`nvm use`) and **pnpm** (`corepack pnpm` if it isn't on your PATH). Run `pnpm install` under Node 24: under an older Node, pnpm silently skips Vitest's native binding.

```bash
pnpm dev | build | lint | typecheck   # typecheck = next typegen + tsc (PageProps/LayoutProps come from typegen)
pnpm test                             # Vitest
pnpm test:db:prepare                  # migrate + seed the TEST database branch
pnpm db:generate | db:migrate | db:seed | db:studio
pnpm db:make-admin <email>            # promote an existing account to admin
pnpm auth:generate                    # Better Auth tables → src/db/schema/auth.ts
```

`pnpm build` needs `.env.local` (see `.env.example`). Checkout only turns on when both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set.

**Local Stripe:** run `stripe listen --forward-to localhost:3000/api/stripe/webhook` while testing checkout, and take `STRIPE_WEBHOOK_SECRET` from `stripe listen --print-secret`. The CLI must be logged into the **same sandbox** as `STRIPE_SECRET_KEY`. If they differ, payments succeed in Stripe but no event ever reaches the app, and orders stay "pending" on the confirmation page. To check: `stripe checkout sessions list` (CLI) must show the sessions the app creates. Don't use the app's restricted key for `stripe listen`.

## Testing

- Validation tests always run. Database tests (`test/*.db.test.ts`) run only against a separate Neon branch set as `TEST_DATABASE_URL` in `.env.test`. `test/setup.ts` always overrides `DATABASE_URL` and refuses any URL that reaches the app's database (including Neon's `-pooler` host and a `DATABASE_URL` set in the shell). Never weaken this guard or point tests at the app's database.
- Code that tests call directly (`src/lib/inventory.ts`, `src/lib/checkout/orders.ts`) must not import Next.js; Next calls (`updateTag`, `revalidateTag`, `refresh`) go in the server actions and route handlers that wrap them.
- There are no end-to-end tests. UI work is checked by running the app and looking at it at phone and desktop widths.

## Rules

### Frontend
- **Design system:** token colors only (the default Tailwind palette is removed), `type-*` roles for text, the `px-gutter`, `py-section` and `pt-header` spacing, and the existing primitives (`page-container`, `product-grid`, `media-product`, `btn`, `link-*`, …). Tailwind only generates classes written out in full, so never build class names with template strings.
- **Images:** Unsplash only, always through `UnsplashImage` (Unsplash resizes; Next's optimizer times out on the originals). The CSP allows no other image host.
- **Layouts:** a client component that calls `usePathname()` in a layout must sit inside `<Suspense>` with a pathname-less fallback (see the store and account layouts), or routes with unknown params fail the build.
- **Forms that call server actions:** dispatch from `onSubmit` + `startTransition`, not the `action` prop, so React doesn't reset the fields when the server returns errors.
- **Stock wording:** low stock means at or below `LOW_STOCK_THRESHOLD` (3). Cards, product page, bag and admin all use `stockState` / `productAvailability` from `src/lib/products.ts`; don't add a second rule.

### Trust and access
- **The client never sets prices, totals or payment state.** The bag cookie holds only `{slug, size, quantity}`. Prices and stock are always read live from the database (`getLiveProducts`, uncached). Checkout takes no client input.
- **Admin access is checked in layers:** the proxy (404 for non-admins), the admin layout (`requireAdmin`), every function in `src/lib/admin/queries.ts` (`requireAdmin`) and every exported server action in `src/lib/admin/actions/` (`await assertAdmin()` as its first line). Server actions are public endpoints, so the layout alone never protects them.
- **Customer data:** functions that return a customer's orders read the session themselves and filter by user id in SQL (`src/lib/account-orders.ts`). Never take a user id from the caller.
- **Validate on the server** with zod. Use strict digit regexes for counts, never `z.coerce` (it turns `""` into 0).
- Server code reads config from `env` (`src/lib/env.ts`), not `process.env`. Security headers and the CSP live in `next.config.ts`; add any new script, font or image host there.

### Data
- Drizzle on the Neon HTTP driver: no interactive transactions. `db.batch` runs as one transaction, so use it for multi-statement writes that must be atomic. Re-export every table from `src/db/schema/index.ts`.
- Schema changes: edit the schema, `pnpm db:generate`, review the SQL, `pnpm db:migrate`, commit `drizzle/`. `db:push` only on a throwaway database.
- Money is integer cents.
- Stock is per size in `product_stock` (not a variant table: no per-size price, SKU or image). One-size items use one row labelled `ONE_SIZE`. `quantity` means available to sell: units in unpaid checkouts are already subtracted.
- Size labels can't be renamed, and a size can't be removed while unpaid checkouts hold it: releases find the stock row by `(product_id, size_label)`.
- Products are retired by hiding them (`is_active = false`), never deleted (orders reference them). Every storefront read, `getLiveProducts` and `reserveOrder` filter on it; admin queries don't.
- Storefront reads go only through `src/lib/product-queries.ts` (`'use cache'` + `cacheTag("products")`). After product, category or stock writes in a server action call `updateTag("products")`; outside server actions (e.g. the Stripe webhook) use `revalidateTag("products", "max")` via `stockChanged()`. After adding, renaming, hiding or listing products or categories, also call `forgetKnownSlugs()`.
- `src/proxy.ts` can't use cached functions. Its slug check is a 60-second in-memory set kept on `globalThis`, because the proxy is bundled separately from server actions.
- `pnpm db:seed` upserts seeded products and **replaces their stock**. It's for setting up a database, never for a live one.

### Checkout and payment
- `startCheckout` re-checks the bag, then `reserveOrder` takes stock and creates the pending order in one batch (the `quantity >= 0` CHECK and a row-count guard roll it back). The Stripe session is built from those same rows.
- Only `applyCheckoutSession` (`src/lib/checkout/sync.ts`) marks an order paid, and only from a session fetched from Stripe, after checking currency and amount. The webhook (signature checked on the raw body, events de-duplicated in `stripe_events`) is the main path. The success page is read-only.
- `payment_status` only moves forward, through conditional updates; stock is returned (`endOrderAndRelease`) only when the status actually changed.
- An order whose Stripe amount doesn't match is never marked paid: `holdForReview` keeps its stock and takes it out of the stale-order sweep, for manual review.

## Deliberate limits

Unsplash URLs only (no uploads). No stock history, warehouses or reservation system beyond pending orders. No refunds or fulfilment. Missed webhooks are only recovered by the stale-order sweep inside `startCheckout`; there is no scheduled reconcile job yet.
