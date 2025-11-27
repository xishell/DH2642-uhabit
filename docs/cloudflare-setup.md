# Cloudflare Local Setup

This guide explains how to set up and run the project locally with Cloudflare Workers, D1 database, and authentication features.

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (installed via Bun)
- Cloudflare account (free tier works)

## Why Cloudflare Development Mode?

The standard `bun dev` command runs a basic Vite dev server, but it doesn't provide access to:

- **Cloudflare Workers runtime** - Required for production-like environment
- **D1 Database** - Cloudflare's SQLite database
- **Platform bindings** - Environment variables, KV stores, etc.
- **Better-auth** - Requires async_hooks support from Cloudflare Workers

For these features, you must use `bun run dev:cf` which runs the project through Wrangler.

## Configuration Files

### 1. wrangler.toml

Located at the project root, this file configures your Cloudflare Workers environment:

```toml
name = "uhabit"
compatibility_date = "2025-11-26"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "uhabit-db"
database_id = "your-database-id"
```

**Key settings:**

- `nodejs_compat` - Enables Node.js APIs like async_hooks (required for better-auth)
- `d1_databases` - Binds your D1 database to the `DB` variable

### 2. .dev.vars

Create your local environment variables file:

```bash
cp .dev.vars.example .dev.vars
```

Generate a secure secret and update `.dev.vars`:

```bash
openssl rand -base64 32
```

Then edit `.dev.vars`:

```env
BETTER_AUTH_SECRET=<paste-your-generated-secret>
BETTER_AUTH_URL=http://localhost:8788
```

**Important:**

- `.dev.vars` is in `.gitignore` (never commit secrets!)
- The secret must be a random string for secure authentication
- The URL should match your local dev server port (default: 8788)

## Setting Up D1 Database

### 1. Install Wrangler

```bash
bun add -d wrangler
```

### 2. Login to Cloudflare

```bash
bunx wrangler login
```

### 3. Create D1 Database

Each developer should create their own local D1 database:

```bash
bunx wrangler d1 create uhabit-db-local
```

This outputs a database ID. Copy it for the next step.

### 4. Configure Local Database

Create a `wrangler.local.toml` file (this file is gitignored):

```bash
cp wrangler.local.toml.example wrangler.local.toml
```

Edit `wrangler.local.toml` and add your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "uhabit-db-local"
database_id = "<paste-your-database-id-here>"
```

**Important:** Never commit `wrangler.local.toml` - it's in `.gitignore` to keep each developer's database configuration separate.

### 5. Run Migrations

Apply your database schema to your local database:

```bash
bunx wrangler d1 execute uhabit-db-local --local --file=./drizzle/0000_initial_schema.sql
```

For remote databases (staging/production), use `--remote`:

```bash
bunx wrangler d1 execute uhabit-db-staging --remote --file=./drizzle/0000_initial_schema.sql
```

### 6. Verify Database

Check that tables were created:

```bash
bunx wrangler d1 execute uhabit-db-local --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Running the Development Server

### Standard Development (No Cloudflare features)

```bash
bun dev
```

Opens at `http://localhost:5173` - Use for frontend-only development.

### Cloudflare Development (Full features)

```bash
bun run dev:cf
```

Opens at `http://localhost:8788` - Use when you need:

- Database access
- Authentication
- Cloudflare Workers APIs
- Production-like environment

**What this command does:**

1. Builds the project with `bun run build`
2. Starts Wrangler dev server with `nodejs_compat` flag
3. Enables live reload on file changes

## Development Workflow

### For Frontend Work

Use `bun dev` for faster hot reload when not needing Cloudflare features.

### For Backend/Auth Work

Use `bun run dev:cf` to test:

- API endpoints
- Database queries
- Authentication flows
- Server-side rendering with platform context

### Switching Between Modes

1. Stop current dev server (Ctrl+C)
2. Start desired mode
3. Clear browser cache if experiencing issues

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Better Auth with Cloudflare](https://www.better-auth.com/docs/integrations/cloudflare)
- [SvelteKit Cloudflare Adapter](https://kit.svelte.dev/docs/adapter-cloudflare)
