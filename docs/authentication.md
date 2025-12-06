# Authentication Integration Guide

This guide shows how to integrate Better Auth authentication into your SvelteKit pages and components.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client Setup](#client-setup)
3. [Sign-Up Page](#sign-up-page)
4. [Sign-In Page](#sign-in-page)
5. [Protected Routes](#protected-routes)
6. [Session Management](#session-management)
7. [Server-Side Auth](#server-side-auth)
8. [Advanced Features](#advanced-features)
   - [Development Mode](#development-mode)
   - [Email Verification](#email-verification)
   - [Custom User Fields](#custom-user-fields)

## Architecture Overview

### How Better Auth Works

Better Auth is integrated at three levels:

1. **Server Hooks** (`src/hooks.server.ts`)
   - Runs on every request
   - Creates auth instance with D1 database
   - Populates `event.locals.user` and `event.locals.session`
   - Uses `svelteKitHandler` to handle auth routes

2. **API Routes** (`src/routes/api/auth/[...all]/+server.ts`)
   - Registers auth paths with Cloudflare Workers
   - Actual handling is done by `svelteKitHandler` in hooks

3. **Client** (Your Svelte components)
   - Uses `createAuthClient` to interact with auth API
   - Provides reactive stores for session state

### Authentication Flow

```
User Action → Client (authClient.signIn)
           → API (/api/auth/sign-in)
           → Server (hooks.server.ts)
           → Better Auth Handler
           → D1 Database
           → Response with Session Cookie
           → Client Updates Session Store
```

## Client Setup

### 1. Create Auth Client

Create `src/lib/auth/client.ts`:

```typescript
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	baseURL: 'http://localhost:8788' // Use environment variable in production
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 2. Environment-Aware Base URL

For production, use environment variables:

```typescript
import { dev } from '$app/environment';

export const authClient = createAuthClient({
	baseURL: dev ? 'http://localhost:8788' : 'https://your-production-url.com'
});
```

## Protected Routes

### Server-Side Protection

Use `+page.server.ts` to protect routes:

```typescript
// src/routes/dashboard/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Return user data to the page
	return {
		user: locals.user,
		session: locals.session
	};
};
```

### Client-Side Protection

For client-side navigation guards:

```svelte
<script lang="ts">
	import { useSession } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const session = useSession();

	onMount(() => {
		if (!$session.data) {
			goto('/login');
		}
	});
</script>

{#if $session.data}
	<div>
		<!-- Protected content -->
	</div>
{:else}
	<div>Loading...</div>
{/if}
```

## Session Management

### Display User Info

```svelte
<script lang="ts">
	import { useSession, signOut } from '$lib/auth/client';
	import { goto } from '$app/navigation';

	const session = useSession();

	async function handleSignOut() {
		await signOut();
		goto('/');
	}
</script>

{#if $session.data}
	<div class="flex items-center gap-4">
		<span>Welcome, {$session.data.user.name}!</span>
		<button onclick={handleSignOut} class="text-red-600 hover:underline"> Sign Out </button>
	</div>
{:else}
	<a href="/login" class="text-blue-600 hover:underline"> Sign In </a>
{/if}
```

### Check Session Status

```svelte
<script lang="ts">
	import { useSession } from '$lib/auth/client';

	const session = useSession();

	// Reactive statements
	$effect(() => {
		if ($session.data) {
			console.log('User is signed in:', $session.data.user);
		} else {
			console.log('User is signed out');
		}
	});
</script>
```

## Server-Side Auth

### Access User in Server Routes

```typescript
// src/routes/api/habits/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Access user data
	const userId = locals.user.id;

	// Fetch user-specific data
	// const habits = await db.query.habits.findMany({
	//   where: eq(schema.habits.userId, userId)
	// });

	return json({ user: locals.user });
};
```

### Access User in Server Actions

```typescript
// src/routes/habits/+page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	create: async ({ locals, request }) => {
		// Check authentication
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const habitName = data.get('name');

		// Create habit for user
		// await db.insert(schema.habits).values({
		//   userId: locals.user.id,
		//   name: habitName
		// });

		return { success: true };
	}
};
```

## Advanced Features

### Development Mode

For easier testing on staging environments, you can enable development mode with relaxed security settings.

**⚠️ WARNING: Never enable DEV_MODE in production!**

#### What Dev Mode Does

When enabled, dev mode provides:

- **Relaxed password requirements**: Minimum password length of 4 characters (vs 8+ in production)
- **Extended sessions**: 30-day session duration (vs 7 days in production)
- **Extended session updates**: 7-day update age (vs 1 day in production)
- **No email verification**: Skip email verification for faster testing
- **Debug logging**: Additional logging to help with troubleshooting

#### Enabling Dev Mode

Dev mode is automatically enabled for localhost development. For staging/preview environments:

1. **Preview environment** (already configured in `wrangler.toml`):

   ```toml
   [env.preview.vars]
   DEV_MODE = "true"
   ```

2. **Local development** (.env file):

   ```bash
   # Optional - auto-detected for localhost
   DEV_MODE=true
   ```

3. **Production** (already configured in `wrangler.toml`):
   ```toml
   [env.production.vars]
   DEV_MODE = "false"
   ```

#### How It Works

The auth configuration automatically detects dev mode:

```typescript
// src/lib/server/auth.ts
export function createAuth(db: D1Database, secret: string, url: string, devMode = false) {
	// Auto-detect localhost or use environment variable
	const isDev = devMode || url.includes('localhost') || url.includes('127.0.0.1');

	if (isDev) {
		console.log('[AUTH] Running in DEVELOPMENT mode - relaxed security settings enabled');
	}
	// ... applies dev-specific configuration
}
```

#### Production Checklist

Before deploying to production, ensure:

- [ ] `DEV_MODE` environment variable is **not set** or set to `false`
- [ ] URL does not contain `localhost` or `127.0.0.1`
- [ ] Email verification is enabled (if using email/password auth)
- [ ] Strong password requirements are enforced
- [ ] Session duration is appropriately short (7 days)

### Email Verification

Enable in `src/lib/server/auth.ts`:

```typescript
export function createAuth(db: D1Database, secret: string, url: string) {
	return betterAuth({
		// ... other config
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true // Enable verification for production
		}
		// ... rest of config
	});
}
```

**Note**: Email verification is automatically disabled in dev mode. To test email verification, you'll need to configure an email provider and disable dev mode.

### Custom User Fields

Already configured in `src/lib/server/auth.ts`:

```typescript
user: {
  additionalFields: {
    displayName: {
      type: 'string',
      required: false
    },
    theme: {
      type: 'string',
      required: false,
      defaultValue: 'system'
    },
    country: {
      type: 'string',
      required: false
    },
    preferences: {
      type: 'string',
      required: false
    }
  }
}
```

Access in components:

```svelte
<script lang="ts">
	import { useSession } from '$lib/auth/client';
	const session = useSession();

	$effect(() => {
		if ($session.data) {
			console.log('Theme:', $session.data.user.theme);
			console.log('Display name:', $session.data.user.displayName);
		}
	});
</script>
```

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth SvelteKit Guide](https://www.better-auth.com/docs/integrations/svelte-kit)
- [Better Auth API Reference](https://www.better-auth.com/docs/reference/api)
- [SvelteKit Server Hooks](https://kit.svelte.dev/docs/hooks#server-hooks)
