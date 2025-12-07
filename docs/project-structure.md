# Project Structure

```
uhabit/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte              # Global-default layout
│   │   ├── +layout.server.ts           # User session management, keeps track of session tokens
│   │   ├── +page.svelte                # Redirects users after they have logged in, page = views
│   │   ├── + (more files come later...?)
│   │   │
│   │   ├── overview/
│   │   │   ├── +page.svelte            # Daily overview with habit tracking
│   │   │   └── +page.server.ts
│   │   │
│   │   ├── habits/
│   │   │   ├── +page.svelte            # Habit planning/management page
│   │   │   ├── +page.server.ts
│   │   │   ├── [id]/                   # Edit existing habit
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── new/
│   │   │       ├── +page.svelte        # Create new habit
│   │   │       └── +page.server.ts
│   │   │
│   │   ├── statistics/
│   │   │   ├── +page.svelte            # Contains overview defaults like the navbar and default placements of components, renders conditionally
│   │   │   ├── +page.server.ts
│   │   │   ├── components/
│   │   │   │   ├── Weekly.svelte
│   │   │   │   ├── Daily.svelte
│   │   │   │   └── Monthly.svelte
│   │   │   └── details/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   │
│   │   ├── login/
│   │   │   ├── +page.svelte            # Login page wrapper
│   │   │   └── LoginForm.svelte        # Login form component with email/password
│   │   │
│   │   ├── register/
│   │   │   ├── +page.svelte            # Registration page wrapper
│   │   │   └── RegisterForm.svelte     # Registration form component
│   │   │
│   │   ├── profile/                    # User profile management
│   │   ├── settings/                   # App settings
│   │   │
│   │   ├── api/                        # Internal API endpoints
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── +server.ts      # Better-auth handler (signup, signin, signout, etc.)
│   │   │   └── user/
│   │   │       └── preferences/
│   │   │           └── +server.ts      # GET/PATCH user preferences
│   │   │
│   │   └── api-external/               # External API integrations
│   │
│   ├── lib/
│   │   ├── components/                 # Reusable Svelte components
│   │   │   ├── Btn.svelte
│   │   │   ├── HabitCard.svelte
│   │   │   ├── PasswordStrengthIndicator.svelte
│   │   │   ├── SelectMonthDay.svelte
│   │   │   ├── SelectOrEdit.svelte
│   │   │   ├── SelectWeekDay.svelte
│   │   │   └── ToggleBar.svelte
│   │   ├── utils/                      # Client-side utilities
│   │   ├── types/                      # Shared TypeScript types
│   │   │   └── habit.ts                # Habit type definition
│   │   ├── assets/                     # Static assets (images, icons)
│   │   │
│   │   ├── server/                     # Server-only code (never sent to client)
│   │   │   ├── auth.ts                 # Better-auth configuration (createAuth function)
│   │   │   └── db/
│   │   │       ├── index.ts            # D1 database connection (getDB function)
│   │   │       └── schema.ts           # Drizzle schema (user, session, account, verification, habits)
│   │   │
│   │   ├── auth/
│   │   │   └── client.ts               # Better-auth client (authClient, signIn, signUp, signOut, useSession)
│   │   │
│   │   ├── db/                         # Shared database types (if needed on client)
│   │   │
│   │   ├── api/                        # API utility functions
│   │   │   ├── internal/               # Internal API helpers
│   │   │   └── external/               # External API helpers
│   │   │
│   │   ├── stores/                     # Svelte stores for state management
│   │   │   ├── user.ts                 # User state
│   │   │   ├── habits.ts               # Habit tracking state
│   │   │   ├── ui.ts                   # UI state
│   │   │   └── stats.ts                # Statistics state
│   │   │
│   │   └── index.ts                    # Re-exports for lib modules
│   │
│   ├── app.d.ts                        # TypeScript definitions (Locals interface with auth, user, session)
│   ├── error.html                      # Error page template
│   └── hooks.server.ts                 # Server hooks (auth setup with svelteKitHandler)
│
├── static/                             # Static assets served at root
├── tests/                              # Test files (unit & integration)
├── scripts/                            # Build and utility scripts
│   └── migrate.ts                      # Smart migration runner
│
├── docs/                               # Project documentation
│   ├── project-structure.md            # This file
│   ├── local-development-setup.md      # Development tools & formatting
│   ├── cloudflare-setup.md             # Cloudflare Workers & D1 setup
│   ├── authentication.md               # Auth integration guide
│   ├── api-habits.md                   # Habit API documentation
│   └── migrations.md                   # Database migration workflow
│
├── drizzle/                            # Database migrations
│   └── 0000_*.sql                      # SQL migration files
│
├── .dev.vars                           # Local dev environment variables (Cloudflare/Wrangler)
├── .env                                # Environment variables (general)
├── .env.example                        # Example environment configuration
├── .gitignore                          # Git ignore rules
├── .prettierrc                         # Prettier configuration
├── .prettierignore                     # Prettier ignore rules
├── svelte.config.js                    # SvelteKit configuration
├── vite.config.ts                      # Vite build configuration
├── drizzle.config.ts                   # Drizzle ORM configuration
├── wrangler.toml                       # Cloudflare Workers/D1 configuration
├── tsconfig.json                       # TypeScript configuration
├── package.json                        # Dependencies & scripts
└── bun.lock                            # Bun lockfile
```

## Additional Documentation

- [Local Development Setup](./local-development-setup.md) - Code formatting and development tools
- [Cloudflare Local Setup](./cloudflare-setup.md) - Configure Cloudflare Workers and D1 locally
- [Authentication Integration](./authentication.md) - Implement sign-up/sign-in with Better Auth
- [Database Migrations](./migrations.md) - Database migration workflow and best practices
- [Habit API](./api-habits.md) - API documentation for habit management
