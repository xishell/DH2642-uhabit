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
│   │   │       ├── +progressiveList.svelte
│   │   │       ├── +taskList.svelte
│   │   │       └── +progressBar.svelte
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
│   │   │           ├── +progressiveList.svelte
│   │   │           ├── +taskList.svelte
│   │   │           └── +progressBar.svelte
│   │   │
│   │   ├── statistics/
│   │   │   ├── +page.svelte            # Contains overview defaults like the navbar and default placements of components, renders conditionally
│   │   │   ├── +page.server.ts
│   │   │   ├── components/
│   │   │   │   ├── +weekly.svelte
│   │   │   │   ├── +daily.svelte
│   │   │   │   └── +monthly.svelte
│   │   │   └── details/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── login/+page.svelte
│   │   │   └── register/+page.svelte
│   │   │
│   │   ├── profile??/                  # TODO
│   │   ├── settings??/                 # TODO
│   │   ├── api/
│   │   └── api-external/
│   │
│   ├── lib/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── types/
│   │   ├── api/
│   │   │   ├── internal/
│   │   │   └── external/
│   │   └── stores/                     # States
│   │       ├── user.ts
│   │       ├── habits.ts
│   │       ├── ui.ts
│   │       └── stats.ts
│   │
│   ├── app.d.ts
│   ├── error.html
│   └── hooks.server.ts
│
├── static/
├── tests/
├── .env
├── svelte.config.js
├── vite.config.ts
├── drizzle.config.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```
