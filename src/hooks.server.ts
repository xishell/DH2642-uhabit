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

	// Create auth instance (only once per request)
	const auth = createAuth(db, secret, url);
	event.locals.auth = auth;

	// Handle auth routes first (this is more efficient)
	const response = await svelteKitHandler({ event, resolve, auth, building });

	// If this was an auth route, svelteKitHandler already handled it
	if (event.url.pathname.startsWith('/api/auth/')) {
		return response;
	}

	// For non-auth routes, fetch session only if needed
	try {
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
	} catch (error) {
		console.error('[HOOKS] Session fetch error:', error);
		event.locals.user = null;
		event.locals.session = null;
	}

	return response;
};
