# Database Migrations Guide

This guide explains how to manage database migrations for the uHabit app.

## Overview

The project uses Drizzle ORM with Cloudflare D1 (SQLite). Migrations are automatically tracked to prevent re-running already applied migrations.

## Quick Start

### 1. Update Schema

Edit your schema in `src/lib/server/db/schema.ts`:

```typescript
export const habit = sqliteTable('habit', {
	id: text('id').primaryKey(),
	// Add new fields here
	newField: text('newField')
});
```

### 2. Generate Migration

```bash
bun run db:generate
```

This creates a new migration file in `drizzle/` with a unique name (e.g., `0004_fancy_hulk.sql`).

### 3. Apply Migration

**Local database:**

```bash
bun run db:migrate
```

**Staging database:**

```bash
bun run db:migrate:staging
```

**Production database:**

```bash
bun run db:migrate:production
```

The migration system:

- Only runs new migrations
- Tracks which migrations have been applied
- Prevents accidental re-runs
- Works for both local and remote databases

## Available Commands

| Command                         | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `bun run db:generate`           | Generate a new migration from schema changes    |
| `bun run db:migrate`            | Apply pending migrations to local database      |
| `bun run db:migrate:staging`    | Apply pending migrations to staging database    |
| `bun run db:migrate:production` | Apply pending migrations to production database |
| `bun run db:status`             | Show all applied migrations (local)             |
| `bun run db:status:staging`     | Show all applied migrations (staging)           |
| `bun run db:status:production`  | Show all applied migrations (production)        |
| `bun run db:studio`             | Open Drizzle Studio to browse database          |

## How It Works

### Migration Tracking

Migrations are tracked in the `__drizzle_migrations` table:

```sql
CREATE TABLE __drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL
);
```

### Smart Migration Script

The `scripts/migrate.ts` script:

1. Scans `drizzle/` folder for `.sql` files
2. Checks `__drizzle_migrations` table for applied migrations
3. Applies only new migrations in order
4. Records each migration after successful application

### Example Workflow

```bash
# 1. Make schema changes
vim src/lib/server/db/schema.ts

# 2. Generate migration
bun run db:generate
# Output: Created drizzle/0004_brave_thor.sql

# 3. Check what will be applied
bun run db:migrate
# Output:
# Running migrations on local database...
# Found 1 new migration(s) to apply:
#   [*] Applying 0004_brave_thor...
#   [+] Applied 0004_brave_thor
# Successfully applied 1 migration(s)!

# 4. Verify migration status
bun run db:status
# Shows all applied migrations with timestamps

# 5. Run again - no duplicates!
bun run db:migrate
# Output: No new migrations to apply. Database is up to date!
```

## Migration Best Practices

### 1. Always Generate Migrations

Don't manually create migration files. Let Drizzle generate them:

```bash
# GOOD
bun run db:generate

# BAD
touch drizzle/0005_my_migration.sql
```

### 2. Review Generated Migrations

Always review the generated SQL before applying:

```bash
bun run db:generate
cat drizzle/0004_*.sql  # Review the SQL
bun run db:migrate      # Apply if correct
```

### 3. Test Locally First

Always test migrations on local database before production:

```bash
# Test locally
bun run db:migrate

# If successful, apply to production
bun run db:migrate:production
```

### 4. Keep Migrations Atomic

Each migration should represent a single logical change:

**Good:**

- Migration 1: Add `targetAmount` field
- Migration 2: Add `unit` field

**Bad:**

- Migration 1: Add 10 different unrelated changes

### 5. Never Modify Applied Migrations

Once a migration is applied (especially to production), never modify it. Create a new migration instead:

```bash
# DON'T edit drizzle/0004_applied.sql

# DO make a new migration
# Edit schema, then:
bun run db:generate
```

## Remote Database

### Manual Deployment

To apply migrations to your remote Cloudflare D1 databases manually:

**Staging:**

```bash
bun run db:migrate:staging
```

**Production:**

```bash
bun run db:migrate:production
```

After applying migrations, deploy your app:

```bash
bun run build
wrangler pages publish
```

**Important:** Make sure your `wrangler.toml` has the correct database binding:

```toml
[[d1_databases]]
binding = "DB"
database_name = "uhabit-db"
database_id = "your-database-id"
```

### CI/CD Integration

Migrations are automatically applied during deployments via GitHub Actions:

**Staging Deployment (on push to main):**

- Runs tests and builds
- Applies pending migrations to staging database
- Deploys to Cloudflare Pages staging

**Production Deployment (manual trigger):**

- Runs tests and builds
- Applies pending migrations to production database
- Deploys to Cloudflare Pages production

**Migration Step in Workflows:**

Staging:

```yaml
- name: Apply D1 migrations (staging)
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  run: |
    bun run scripts/migrate.ts --remote --env=preview
```

Production:

```yaml
- name: Apply D1 migrations (production)
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  run: |
    bun run scripts/migrate.ts --remote --env=production
```

**Important CI/CD Considerations:**

1. **Migrations run BEFORE deployment** - Ensures database schema is ready for new code
2. **Failed migrations block deployment** - If migration fails, deployment stops
3. **No rollback** - Migrations are one-way; create new migrations to reverse changes
4. **Test in staging first** - Migrations run on staging before production
5. **Secrets required** - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be configured in GitHub repository secrets
