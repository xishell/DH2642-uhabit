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
│   │   │   ├── +page.svelte            # Contains defaults like the navbar and default placements of components, renders conditionally
│   │   │   ├── +page.server.ts
│   │   │   └── components/
│   │   │       ├── ProgressiveList.svelte
│   │   │       ├── TaskList.svelte
│   │   │       └── ProgressBar.svelte
│   │   │
│   │   ├── planning/
│   │   │   ├── +page.svelte            # Contains overview defaults like the navbar and default placements of components, renders conditionally
│   │   │   ├── +page.server.ts
│   │   │   ├── [id]/                   # Editing page of habits
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── new/
│   │   │       ├── +page.svelte
│   │   │       ├── +page.server.ts
│   │   │       └── components/
│   │   │           ├── ProgressiveList.svelte
│   │   │           ├── TaskList.svelte
│   │   │           └── ProgressBar.svelte
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
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── +page.svelte        # Login page with email/password
│   │   │   └── register/
│   │   │       └── +page.svelte        # Registration page
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
│   │   ├── utils/                      # Client-side utilities
│   │   ├── types/                      # Shared TypeScript types
│   │   │
│   │   ├── server/                     # Server-only code (never sent to client)
│   │   │   ├── auth.ts                 # Better-auth configuration
│   │   │   └── db/
│   │   │       ├── index.ts            # D1 database connection (getDB function)
│   │   │       └── schema.ts           # Drizzle schema (user, session, account, verification)
│   │   │
│   │   ├── auth/                       # Client-side auth utilities (to be implemented)
│   │   ├── db/                         # Shared database types (if needed on client)
│   │   │
│   │   ├── api/                        # API utility functions
│   │   │   ├── internal/               # Internal API helpers
│   │   │   └── external/               # External API helpers
│   │   │
│   │   └── stores/                     # Svelte stores for state management
│   │       ├── user.ts                 # User state
│   │       ├── habits.ts               # Habit tracking state
│   │       ├── ui.ts                   # UI state
│   │       └── stats.ts                # Statistics state
│   │
│   ├── app.d.ts
│   ├── error.html
│   └── hooks.server.ts
│
├── static/
├── tests/
├── .env                                # Environment variables (DATABASE_URL, BETTER_AUTH_SECRET)
├── .env.example                        # Example environment configuration
├── svelte.config.js
├── vite.config.ts
├── drizzle.config.ts
├── wrangler.toml                       # Cloudflare D1 configuration
├── package.json
└── tsconfig.json
```
