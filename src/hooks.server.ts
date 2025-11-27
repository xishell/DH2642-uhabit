import type { Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	// Get D1 database from platform
	const db = event.platform?.env?.DB;
	const secret = event.platform?.env?.BETTER_AUTH_SECRET;
	const url = event.platform?.env?.BETTER_AUTH_URL || event.url.origin;

	if (!db || !secret) {
		console.error('[HOOKS] Missing DB or BETTER_AUTH_SECRET in platform.env');
		event.locals.user = null;
		event.locals.session = null;
		event.locals.auth = null as any;
		return resolve(event);
	}

	// Create auth instance
	const auth = createAuth(db, secret, url);
	event.locals.auth = auth;

	// Fetch current session and populate locals
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	// Use svelteKitHandler to handle all auth routes automatically
	return svelteKitHandler({ event, resolve, auth, building });
};
