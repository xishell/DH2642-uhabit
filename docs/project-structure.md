# Project Structure

```
uhabit/
├── src/
│   ├── routes/                        # SvelteKit pages & API endpoints
│   │   ├── +layout.svelte             # Root layout (header, navigation)
│   │   ├── +layout.server.ts          # Layout data loading (user session)
│   │   ├── +page.svelte               # Home page (redirects to /overview)
│   │   ├── +error.svelte              # Error page
│   │   │
│   │   ├── login/                     # Login page
│   │   │   ├── +page.svelte
│   │   │   └── LoginForm.svelte
│   │   │
│   │   ├── register/                  # Registration page
│   │   │   ├── +page.svelte
│   │   │   └── RegisterForm.svelte
│   │   │
│   │   ├── overview/                  # Daily overview dashboard
│   │   │   ├── +page.svelte
│   │   │   └── components/
│   │   │       ├── TopProgress.svelte
│   │   │       ├── TopProgressMultiRing.svelte
│   │   │       ├── TaskSingle.svelte          # Boolean habit task
│   │   │       ├── TaskProgressive.svelte     # Numeric habit task
│   │   │       └── TaskProgressiveDetail.svelte
│   │   │
│   │   ├── habits/                    # Habit planning/management
│   │   │   ├── +page.svelte
│   │   │   └── components/
│   │   │       ├── HabitsListView.svelte
│   │   │       ├── FabMenu.svelte             # Floating action button
│   │   │       └── MotivationCard.svelte      # Quote of the day
│   │   │
│   │   ├── statistics/                # Statistics & analytics
│   │   │   ├── +page.svelte
│   │   │   ├── details/
│   │   │   │   └── +page.svelte
│   │   │   └── components/
│   │   │       ├── DatePicker.svelte
│   │   │       ├── SnapshotCards.svelte
│   │   │       ├── PeriodCard.svelte
│   │   │       ├── PeriodSummary.svelte
│   │   │       ├── TopHabits.svelte
│   │   │       ├── StatPanel.svelte
│   │   │       ├── TrendingCard.svelte
│   │   │       ├── MomentumCard.svelte
│   │   │       ├── HeatmapCard.svelte
│   │   │       ├── ActivityPulse.svelte
│   │   │       └── DragSelectGrid.svelte
│   │   │
│   │   ├── settings/                  # User settings
│   │   │   ├── +page.svelte
│   │   │   └── components/
│   │   │       ├── TabNav.svelte
│   │   │       ├── ProfileCard.svelte
│   │   │       ├── PublicProfile.svelte
│   │   │       ├── Account.svelte
│   │   │       ├── Preferences.svelte
│   │   │       ├── Notifications.svelte
│   │   │       ├── SaveBar.svelte
│   │   │       ├── SettingsSkeleton.svelte
│   │   │       ├── FieldWrapper.svelte
│   │   │       └── MobileNav.svelte
│   │   │
│   │   ├── profile/                   # Public user profile page
│   │   │
│   │   └── api/                       # API endpoints
│   │       ├── auth/[...all]/+server.ts           # Better Auth handler
│   │       │
│   │       ├── habits/+server.ts                  # GET list, POST create
│   │       ├── habits/[id]/+server.ts             # GET, PATCH, DELETE habit
│   │       ├── habits/[id]/complete/+server.ts   # POST quick complete
│   │       ├── habits/[id]/completions/+server.ts
│   │       ├── habits/[id]/completions/[completionId]/+server.ts
│   │       ├── habits/[id]/progress/+server.ts   # POST add progress
│   │       │
│   │       ├── goals/+server.ts                   # GET list, POST create
│   │       ├── goals/[id]/+server.ts              # GET, PATCH, DELETE goal
│   │       ├── goals/[id]/habits/+server.ts       # GET habits for goal
│   │       │
│   │       ├── completions/+server.ts             # GET all completions
│   │       │
│   │       ├── notifications/+server.ts           # GET paginated list
│   │       ├── notifications/[id]/+server.ts      # PATCH read, DELETE dismiss
│   │       ├── notifications/mark-all-read/+server.ts
│   │       ├── notifications/unread-count/+server.ts
│   │       │
│   │       ├── holidays/+server.ts                # GET holidays by country
│   │       │
│   │       ├── push/subscribe/+server.ts          # POST/DELETE subscriptions
│   │       ├── push/vapid-public-key/+server.ts   # GET VAPID key
│   │       │
│   │       ├── user/preferences/+server.ts        # GET/PATCH user settings
│   │       ├── user/avatar/+server.ts             # POST upload avatar
│   │       ├── user/avatar/avatars/[userId]/[filename]/+server.ts
│   │       │
│   │       └── stats/cache/+server.ts             # GET/PUT/DELETE stats cache
│   │
│   ├── lib/
│   │   ├── server/                    # Server-only code (never sent to client)
│   │   │   ├── db/
│   │   │   │   ├── index.ts           # D1 database connection
│   │   │   │   └── schema.ts          # Drizzle schema (11 tables)
│   │   │   ├── auth.ts                # Better Auth configuration
│   │   │   ├── api-helpers.ts         # Auth, DB, rate limit, pagination helpers
│   │   │   ├── ratelimit.ts           # Rate limiting logic
│   │   │   ├── password-validator.ts
│   │   │   ├── notifications/
│   │   │   │   ├── index.ts
│   │   │   │   ├── checkGoalProgress.ts
│   │   │   │   ├── checkStreakMilestone.ts
│   │   │   │   └── checkHolidayConflicts.ts
│   │   │   ├── push/                  # Web Push functionality
│   │   │   │   ├── index.ts
│   │   │   │   ├── vapid.ts           # VAPID key management
│   │   │   │   └── encrypt.ts         # Push encryption
│   │   │   └── holidays/
│   │   │       ├── holidayCache.ts
│   │   │       └── nagerDateClient.ts
│   │   │
│   │   ├── api/                       # Client API functions
│   │   │   ├── habitsApi.ts
│   │   │   └── statsApi.ts
│   │   │
│   │   ├── auth/
│   │   │   └── client.ts              # Client-side auth helpers
│   │   │
│   │   ├── cache/
│   │   │   └── statsCache.ts          # IndexedDB stats cache
│   │   │
│   │   ├── stats/                     # Statistics computation
│   │   │   ├── computeCompletionRate.ts
│   │   │   ├── computeHeatmap.ts
│   │   │   ├── computeInsights.ts
│   │   │   ├── computeStreaks.ts
│   │   │   ├── computeTrends.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── stores/                    # Svelte reactive stores
│   │   │   ├── theme.ts
│   │   │   ├── notifications.svelte.ts
│   │   │   ├── avatar.ts
│   │   │   ├── country.ts
│   │   │   ├── reduceMotion.ts
│   │   │   ├── settingsChanges.ts
│   │   │   └── toaster.ts
│   │   │
│   │   ├── types/                     # TypeScript type definitions
│   │   │   ├── habit.ts
│   │   │   ├── goal.ts
│   │   │   ├── notification.ts
│   │   │   └── holiday.ts
│   │   │
│   │   ├── presenters/                # Data presentation logic (MVP pattern)
│   │   │   ├── overviewPresenter.ts
│   │   │   ├── habitsPresenter.ts
│   │   │   ├── statisticsPresenter.ts
│   │   │   ├── statisticsHelpers.ts
│   │   │   └── quoteCache.ts
│   │   │
│   │   ├── components/                # Shared Svelte components
│   │   │   ├── Header.svelte          # Navigation header
│   │   │   ├── Modal.svelte
│   │   │   ├── HabitModal.svelte      # Habit CRUD modal
│   │   │   ├── GoalModal.svelte       # Goal CRUD modal
│   │   │   ├── HabitCard.svelte
│   │   │   ├── GoalCard.svelte
│   │   │   ├── NotificationBell.svelte
│   │   │   ├── NotificationItem.svelte
│   │   │   ├── ToggleBar.svelte
│   │   │   ├── ColorPicker.svelte
│   │   │   ├── DragSelectGrid.svelte
│   │   │   ├── GoalHabitsSelector.svelte
│   │   │   ├── PasswordStrengthIndicator.svelte
│   │   │   └── ... (more components)
│   │   │
│   │   ├── notifications/             # Push notification client
│   │   │   ├── push.ts                # Service worker registration
│   │   │   ├── idb.ts                 # IndexedDB for notifications
│   │   │   └── examples.ts
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── date.ts                # Date manipulation
│   │   │   ├── habit.ts
│   │   │   ├── goal.ts
│   │   │   ├── cookie.ts
│   │   │   └── modalManager.ts
│   │   │
│   │   ├── actions/                   # Svelte actions
│   │   │   └── dragResize.ts
│   │   │
│   │   ├── constants.ts               # App-wide constants
│   │   ├── constants/
│   │   │   └── countries.ts           # ISO country codes
│   │   ├── routes.ts                  # Centralized route definitions
│   │   └── index.ts
│   │
│   ├── app.html                       # HTML template
│   ├── app.d.ts                       # TypeScript definitions
│   ├── hooks.server.ts                # Server hooks (auth, session)
│   ├── midnight.css                   # Custom CSS
│   └── layout.css                     # Layout styles
│
├── drizzle/                           # Database migrations (auto-generated)
│   └── *.sql                          # SQL migration files
│
├── tests/                             # Test files
│   ├── unit/                          # Unit tests
│   └── api/                           # API validation tests
│
├── static/                            # Static assets
├── docs/                              # Project documentation
│   ├── project-structure.md           # This file
│   ├── local-development-setup.md     # Development tools & formatting
│   ├── cloudflare-setup.md            # Cloudflare Workers & D1 setup
│   ├── authentication.md              # Auth integration guide
│   ├── migrations.md                  # Database migration workflow
│   ├── testing.md                     # Testing guide
│   ├── pre-pr-checklist.md            # Pre-PR checklist
│   └── api/
│       ├── habits.md                  # Habits CRUD API
│       └── completions.md             # Habit completions API
│
├── .github/                           # GitHub Actions CI/CD
├── package.json                       # Dependencies & scripts
├── wrangler.toml                      # Cloudflare Workers config
├── svelte.config.js                   # SvelteKit configuration
├── vite.config.ts                     # Vite build configuration
├── drizzle.config.ts                  # Drizzle ORM configuration
├── tsconfig.json                      # TypeScript configuration
├── eslint.config.js                   # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── .env.example                       # Environment variables template
├── .dev.vars.example                  # Dev environment variables template
└── bun.lock                           # Bun lockfile
```

## Database Schema

The app uses 11 database tables defined in `src/lib/server/db/schema.ts`:

| Table              | Purpose                                |
| ------------------ | -------------------------------------- |
| `user`             | User accounts (Better Auth compatible) |
| `session`          | User sessions                          |
| `account`          | OAuth/credentials (Better Auth)        |
| `verification`     | Email verification tokens              |
| `goal`             | User goals/objectives                  |
| `category`         | Habit categories                       |
| `habit`            | Habits to track                        |
| `habitCompletion`  | Habit completion records               |
| `notification`     | In-app notifications                   |
| `pushSubscription` | Web Push subscriptions                 |
| `holidayCache`     | Cached holiday data                    |
| `statsCache`       | Cached computed statistics             |

## Key Architectural Patterns

### Presenter Pattern (MVP)

The app uses presenters to encapsulate business logic separately from UI components:

- `overviewPresenter.ts` – Manages overview state and habit completion
- `habitsPresenter.ts` – Manages habit planning and CRUD operations
- `statisticsPresenter.ts` – Manages statistics computation and caching

### Multi-Layer Caching

- **Client**: IndexedDB for statistics caching
- **Edge**: Cloudflare KV for quotes and rate limits
- **Server**: Database-backed stats cache with TTL

### API Design

- RESTful endpoints with Zod validation
- Rate limiting via Cloudflare KV
- Pagination support (default 20, max 100)
- ETag-based HTTP caching

## Additional Documentation

- [Local Development Setup](./local-development-setup.md) – Code formatting and development tools
- [Cloudflare Local Setup](./cloudflare-setup.md) – Configure Cloudflare Workers and D1 locally
- [Authentication Integration](./authentication.md) – Implement sign-up/sign-in with Better Auth
- [Database Migrations](./migrations.md) – Database migration workflow and best practices
- [Testing Guide](./testing.md) – Vitest configuration and test examples
- [Pre-PR Checklist](./pre-pr-checklist.md) – Steps before creating a pull request
- [Habits API](./api/habits.md) – API documentation for habit CRUD operations
- [Completions API](./api/completions.md) – API documentation for habit completions
