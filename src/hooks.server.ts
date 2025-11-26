import type { Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Get D1 database from platform
	const db = event.platform?.env?.DB;
	const secret = event.platform?.env?.BETTER_AUTH_SECRET;
	const url = event.platform?.env?.BETTER_AUTH_URL || event.url.origin;

	if (!db || !secret) {
		console.error('Missing DB or BETTER_AUTH_SECRET in platform.env');
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	// Create auth instance for this request
	const auth = createAuth(db, secret, url);

	// Get session from cookie
	const sessionToken = event.cookies.get('better-auth.session_token');

	if (sessionToken) {
		try {
			// Validate session
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
			console.error('Session validation error:', error);
			event.locals.user = null;
			event.locals.session = null;
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
