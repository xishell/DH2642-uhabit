# uhabit

Habit tracking app built with SvelteKit and Cloudflare Workers/D1, featuring Better Auth, Drizzle ORM, and Vitest coverage.

## Team

| Name              | Email           | ID     |
| ----------------- | --------------- | ------ |
| Elliot Steffensen | ellste@kth.se   | 142612 |
| Geoanna Dahore    | dahore@kth.se   | 187167 |
| Jintong Jiang     | jintongj@kth.se | 200160 |

## Features

- Habit overview, planning, and statistics pages built with Svelte 5, Tailwind CSS 4, and Skeleton UI
- Auth via Better Auth running in the Cloudflare Workers runtime
- Cloudflare D1 + Drizzle ORM with migration tooling and Drizzle Studio
- API endpoints validated with Zod and covered by Vitest tests
- CI-friendly scripts for formatting, type checking, and builds

## Quick Start

Prerequisites: [Bun](https://bun.sh/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/), and a Cloudflare account for D1/auth work.

1. Install deps: `bun install`
2. Environment files:
   - `cp .env.example .env` and set `DATABASE_URL` to your local D1 SQLite path (see `.wrangler/state/...`).
   - `cp .dev.vars.example .dev.vars` and set `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`.
   - `cp wrangler.local.toml.example wrangler.local.toml` and add your `database_id` from `bunx wrangler d1 create uhabit-db-local`.
3. Run migrations: `bun run db:migrate` (or `:staging` / `:production` for remotes).
4. Start dev server:
   - Frontend-only: `bun dev` (fastest; no D1/auth)
   - Full Cloudflare runtime: `bun run dev:cf` (Workers + D1 + auth)

More details: [cloudflare-setup.md](docs/cloudflare-setup.md) and [migrations.md](docs/migrations.md).

## Common Commands

| Command                                       | Purpose                                      |
| --------------------------------------------- | -------------------------------------------- |
| `bun run dev` / `bun run dev:cf`              | Standard vs Cloudflare dev servers           |
| `bun run check`                               | SvelteKit sync + type check                  |
| `bun run lint` / `bun run format`             | Prettier check / fix                         |
| `bun run test` / `bun run test:unit`          | Vitest (single run / watch)                  |
| `bun run build`                               | Production build                             |
| `bun run db:generate`                         | Create Drizzle migration from schema changes |
| `bun run db:migrate[:staging \| :production]` | Apply migrations                             |
| `bun run db:status[:staging \| :production]`  | List applied migrations                      |
| `bun run db:studio`                           | Open Drizzle Studio                          |

## Testing

- Run all tests: `bun run test`
- Watch mode: `bun run test:unit`
- Coverage report: `bun run test -- --coverage` (HTML output in `coverage/`)
  See `docs/testing.md` for structure and examples.

## Development Workflow

Trunk-based model with weekly cycles:

- `main` always stable/deployable
- Short-lived `feature/<name>` branches, rebase regularly
- Staging deploys on every merge to `main`; production via review
- Keep CI green by running `check`, `lint`, `test`, and `build` before PRs

## Documentation

- [Project structure](docs/project-structure.md)
- [Local dev & formatting](docs/local-development-setup.md)
- [Cloudflare Workers/D1 setup](docs/cloudflare-setup.md)
- [Auth integration](docs/authentication.md)
- [Habits API](docs/api/habits.md)
- [Completions API](docs/api/completions.md)
- [Migrations workflow](docs/migrations.md)
- [Testing guide](docs/testing.md)
- [CI/CD workflows](.github/WORKFLOWS.md)
