// Better Auth catch-all route handler for SvelteKit
// This exports the auth handlers directly from the Better Auth instance
// See: https://www.better-auth.com/docs/integrations/sveltekit

import { toSvelteKitHandler } from 'better-auth/svelte-kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const auth = event.locals.auth;
	if (!auth) {
		return new Response('Auth not configured', { status: 500 });
	}
	return toSvelteKitHandler(auth)(event);
};

export const POST: RequestHandler = async (event) => {
	const auth = event.locals.auth;
	if (!auth) {
		return new Response('Auth not configured', { status: 500 });
	}
	return toSvelteKitHandler(auth)(event);
};
