# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Atelier Store is a luxury fashion e-commerce storefront. Its visual direction comes from premium fashion sites: black on white, large editorial imagery, small uppercase UI text, square corners. **The frontend is built on dummy data. The backend (database, API, auth flows) is not started.**

Stack: Next.js 16 (App Router, Cache Components on), React 19, TypeScript, Tailwind CSS v4 (set up in CSS), Better Auth, Drizzle ORM and Neon Postgres. Next 16 differs from older versions, so read `node_modules/next/dist/docs/` before writing Next code. For example, `priority` is now `preload`, `middleware` is now `proxy.ts`, and `dynamicParams` isn't available with Cache Components.

## Commands

Node 24 (`nvm use`), **pnpm** (`packageManager` is set in package.json; if `pnpm` isn't on your PATH, run it as `corepack pnpm`).

```bash
pnpm dev | build | lint
pnpm typecheck        # next typegen + tsc (PageProps/LayoutProps come from typegen)
pnpm auth:generate    # Better Auth tables → src/db/schema/auth.ts
pnpm db:generate | db:migrate | db:push | db:studio
```

There's no test framework. `pnpm build` needs these env vars in `.env.local` (copy `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ chars), `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. Until the auth tables exist, the build logs a "Drizzle schema mismatch" error; that's expected.

## Structure

```
src/app/(store)/          storefront route group; layout.tsx = header + <main id="main"> + footer
  page.tsx                homepage
  products/[slug]/        product page (generateStaticParams from products.ts)
src/app/design/           design system reference page (/design)
src/app/not-found.tsx     styled 404
src/app/api/auth/         Better Auth handler
src/proxy.ts              real 404 for unknown /products/* (page shell streams first, so notFound() alone gives 200)
src/components/ui/        Button/ButtonLink, Container/Section, TextLink, AccordionItem, UnsplashImage
src/components/site/      SiteHeader (client: hides on scroll, transparent on PAGES_WITH_HERO, bag count), SiteFooter, NewsletterForm
src/components/home/      Hero, FeaturedCollections, ProductRail, CampaignSplit, CategoryGrid, ServicesStrip
src/components/product/   ProductCard, ProductGallery, PurchasePanel
src/lib/products.ts       DUMMY products: sizes with per-size stock, categories, stock helpers
src/lib/catalog.ts        DUMMY homepage content (hero, collections, nav, footer)
src/lib/bag.ts            bag stored in the browser (localStorage + useSyncExternalStore)
src/lib/{auth,auth-client,env}.ts, src/db/   backend scaffolding (unused by the frontend so far)
src/styles/               design tokens, base, typography, layout, components (loaded from app/globals.css)
```

## Rules

- **Design system:** use token colors only (the default Tailwind palette is removed), `type-*` roles for text, and the `px-gutter`, `py-section` and `pt-header` spacing. Use the primitives (`page-container`, `product-grid`, `media-product`, `btn`, `link-*`, …). Tailwind only generates classes it finds written in full in the source, so never build class names with template strings.
- **Images:** Unsplash photos must use `UnsplashImage` (Unsplash resizes them). Sending the originals through Next's optimizer times out.
- **Database:** Drizzle on the Neon HTTP driver, which has no interactive transactions (switch to `neon-serverless` if you need them). Re-export every table from `src/db/schema/index.ts`.
- **Auth:** the Better Auth `nextCookies()` plugin must stay last. Never import `server-only` in `auth.ts`, `env.ts` or `db/index.ts`, because the Better Auth command-line tool loads them outside Next.
- Server code reads config from `env` (`src/lib/env.ts`, zod), not from `process.env`.

## Database conventions

- Products, categories and stock live in Postgres. Tables are in `src/db/schema/products.ts`. Read them only through `src/lib/product-queries.ts`, which caches with `'use cache'` and `cacheTag("products")`. After a write, call `updateTag("products")`.
- Prices are integer cents (`price_cents`).
- Stock is per size in `product_stock` (one row per product and size, `quantity` ≥ 0). It is not a variant table: no per-size price, SKU or image. One-size items use one row labelled `ONE_SIZE` ("One size").
- `product_images` holds the extra gallery photos. The product's own `image_*` columns are the first photo, so the gallery is `[image, ...product_images]`.
- `categories.show_on_home` controls the homepage category grid. Categories without it (currently accessories) don't appear there.
- Schema changes: edit the schema, run `pnpm db:generate`, review the SQL, run `pnpm db:migrate`, and commit `drizzle/`. Use `db:push` only on a throwaway local database.
- `pnpm db:seed` runs `src/db/seed.ts` with the data in `src/db/seed/data.ts`. The seed is idempotent and builds its own client, so it doesn't load `src/lib/env.ts`. The app itself never reads `src/db/seed/data.ts`.
- `db.batch` on the Neon HTTP driver runs as one transaction. Use it for multi-statement writes that must be atomic.
- `src/proxy.ts` checks slugs with the uncached `productExists()`. `'use cache'` doesn't work when called from the proxy, so don't use cached functions there.

## Done (frontend, dummy data)

- Design system plus the `/design` reference page.
- Homepage: hero, collections, product rail, campaign, categories, services, footer with a newsletter form (newsletter isn't connected to anything).
- Product page: placeholder gallery, size, color and quantity, stock states, add to bag (limited by stock and `MAX_PER_ITEM`), accordions, related products, real 404.
- Header bag count that survives reloads.

## Next (backend)

1. **Database:** product, category, variant (size + stock), order and order item tables in `src/db/schema/`, plus a seed script built from `src/lib/products.ts`. Then replace the dummy imports with queries (`'use cache'` and cache tags).
2. **Auth:** run `auth:generate` and migrate, turn on sign-in methods in `auth.ts`, and add sign-in/sign-up and account pages.
3. **Bag and checkout:** move the bag to the server (tied to the session or a cookie), check stock on the server and reduce it in a transaction (needs `neon-serverless`), then build a bag page and checkout.
4. **Missing pages** that links already point to: `/collections/[slug]`, `/stories/*`, `/help/*`, `/account`, `/stores`.
