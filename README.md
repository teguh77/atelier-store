# Atelier Store

E-commerce app starter: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Better Auth · Drizzle ORM · Neon Postgres.

This is the project skeleton only. No e-commerce features, auth flows, database tables or UI yet.

## Requirements

- Node.js 22.12 or newer (the project pins Node 24 in `.nvmrc`, so run `nvm use`)
- A Neon Postgres database

## Setup

```bash
nvm use
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

## Environment variables

| Variable              | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `DATABASE_URL`        | Neon pooled connection string                             |
| `BETTER_AUTH_SECRET`  | At least 32 random characters (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL`     | The app's base URL, e.g. `http://localhost:3000`          |
| `NEXT_PUBLIC_APP_URL` | Base URL used by the browser auth client                  |

Server variables are checked at startup in `src/lib/env.ts`.

## Project layout

```
src/
  app/
    api/auth/[...all]/route.ts   Better Auth request handler
    layout.tsx, page.tsx         Placeholder shell
  db/
    index.ts                     Drizzle client (Neon HTTP driver)
    schema/index.ts              Exports all tables (empty for now)
  lib/
    auth.ts                      Better Auth server instance (Drizzle adapter)
    auth-client.ts               Better Auth React client
    env.ts                       Server env validation (zod)
drizzle/                         Generated SQL migrations
drizzle.config.ts                drizzle-kit config
```

## Scripts

| Script                  | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | Start the dev server                                         |
| `pnpm build`         | Production build                                             |
| `pnpm lint`          | ESLint                                                       |
| `pnpm typecheck`     | Generate Next route types, then run `tsc`                    |
| `pnpm auth:generate` | Write the Better Auth tables to `src/db/schema/auth.ts`      |
| `pnpm db:generate`   | Create SQL migrations from the schema                        |
| `pnpm db:migrate`    | Apply migrations to the database                             |
| `pnpm db:push`       | Push the schema straight to the database (prototyping only)  |
| `pnpm db:studio`     | Open Drizzle Studio                                          |

## Next steps

1. Generate the auth tables: `pnpm auth:generate`, then add `export * from "./auth";` to `src/db/schema/index.ts`.
2. Create and apply the migration: `pnpm db:generate && npm run db:migrate`.
3. Turn on sign-in methods (`emailAndPassword`, `socialProviders`) in `src/lib/auth.ts`.

Until step 2 is done, Better Auth logs a "Drizzle schema mismatch" error during build. That is expected.

## Notes

- Do not import `server-only` in `src/lib/auth.ts` or the files it imports (`env.ts`, `db/index.ts`). The Better Auth CLI cannot load them if you do.
- The Neon HTTP driver does not support interactive transactions. If you need them later, switch `src/db/index.ts` to `drizzle-orm/neon-serverless`.
