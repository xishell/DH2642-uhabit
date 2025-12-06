import type { Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth setup for static assets (huge performance improvement)
	const isStaticAsset =
		event.url.pathname.startsWith('/_app/') ||
		event.url.pathname.startsWith('/favicon') ||
		event.url.pathname.endsWith('.css') ||
		event.url.pathname.endsWith('.js') ||
		event.url.pathname.endsWith('.png') ||
		event.url.pathname.endsWith('.jpg') ||
		event.url.pathname.endsWith('.svg') ||
		event.url.pathname.endsWith('.ico');

	if (isStaticAsset) {
		return resolve(event);
	}

	// Get D1 database from platform
	const db = event.platform?.env?.DB;
	const secret = event.platform?.env?.BETTER_AUTH_SECRET;
	const url = event.platform?.env?.BETTER_AUTH_URL || event.url.origin;
	const devMode = event.platform?.env?.DEV_MODE === 'true';

	if (!db || !secret) {
		console.error('[HOOKS] Missing DB or BETTER_AUTH_SECRET in platform.env');
		event.locals.user = null;
		event.locals.session = null;
		event.locals.auth = null as any;
		return resolve(event);
	}

	// Create auth instance and store in locals
	// The route handler at /api/auth/[...all] will use this
	const auth = createAuth(db, secret, url, devMode);
	event.locals.auth = auth;

	// For non-auth routes, fetch session to populate locals.user
	// Skip session fetch for auth routes (they don't need it and it saves resources)
	if (!event.url.pathname.startsWith('/api/auth/')) {
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
	} else {
		// For auth routes, set to null (the auth handler will manage its own session)
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
