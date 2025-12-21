# uhabit

Habit tracking app built with SvelteKit and Cloudflare Workers/D1, featuring Better Auth, Drizzle ORM, and Vitest coverage.

## Team

| Name              | Email           | ID     | Roles                                                  |
| ----------------- | --------------- | ------ | ------------------------------------------------------ |
| Elliot Steffensen | ellste@kth.se   | 142612 | Project Admin/DBA, Head Dev, Back-End Dev, QA Tester   |
| Geoanna Dahore    | dahore@kth.se   | 187167 | Project Manager, Frontend dev, UI+UX Dev, Web Designer |
| Jintong Jiang     | jintongj@kth.se | 200160 | UI/UX Designer, Frontend dev, Figma, User testing      |

## Features

### Core Habit Tracking

- **Create and manage habits** with customizable titles, notes, and colors
- **Two measurement types**:
  - **Boolean habits** – Simple checkbox completion (e.g., "Meditate")
  - **Numeric habits** – Track progress toward a target (e.g., "Drink 8 cups of water")
- **Three frequency options**: Daily, Weekly (select specific days), Monthly (select specific dates)
- **Goal management** – Organize habits into time-bound goals with start/end dates
- **Categories** – Group habits by custom categories

### Daily Overview Dashboard

- Today's habit checklist with real-time completion status
- Toggle between Habits and Goals views
- Multi-ring progress visualization showing daily completion
- Quick-complete actions for boolean habits
- Incremental progress tracking for numeric habits

### Planning Page

- Complete list of all habits and goals
- Create, edit, and delete habits/goals via modal dialogs
- Floating action button (FAB) menu for quick actions
- Daily motivational quote feature

### Statistics & Analytics

- **Date range picker** – View stats for custom periods
- **Period views** – Daily, weekly, and monthly statistics
- **Heatmap visualization** – Activity calendar showing completion patterns
- **Streak tracking** – Current and longest streaks for each habit
- **Completion rates** – Percentage-based progress tracking
- **Habit trends** – Sparkline visualizations of recent activity
- **Period summaries** – Aggregated statistics per time period
- **Activity pulse** – Real-time activity indicators
- **Top habits** – Rankings based on completion consistency
- **Advanced insights** – Volatility analysis, best performance windows, milestones, recovery speed

### User Accounts & Settings

- Email/password authentication with Better Auth
- Username-based login support
- Profile customization (display name, pronouns, bio, avatar)
- Theme preferences (light/dark/system)
- Country selection for holiday integration
- Avatar upload with Cloudflare R2 storage

### Notifications System

- **In-app notifications** – Persistent notification center with unread count
- **Notification types**:
  - Habit reminders
  - Streak milestone alerts (10, 30, 100+ days)
  - Goal progress updates
  - Holiday conflict suggestions
- **Web Push notifications** – Cross-device push notifications via service workers
- **Configurable preferences** – Enable/disable notification types and reminder times

### Holiday Integration

- Automatic holiday detection based on user's country
- Cached holiday data via Nager.Date API
- Smart suggestions to reschedule habits on holidays

### Technical Features

- Built with **Svelte 5**, **Tailwind CSS 4**, and **Skeleton UI**
- Auth via **Better Auth** with password security (Have I Been Pwned integration)
- **Cloudflare D1** (SQLite) + **Drizzle ORM** with migration tooling
- API endpoints validated with **Zod**
- Multi-layer caching: IndexedDB (client), KV (edge), server-side stats cache
- Rate limiting on API endpoints
- ETag-based HTTP caching for efficient data fetching
- Test coverage with **Vitest**
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
