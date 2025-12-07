import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { routes } from '$lib/routes';

export const load: LayoutServerLoad = async (event) => {
	// Auth instance is already created in hooks.server.ts and available in event.locals.auth
	if (!event.locals.auth) {
		console.error('Auth instance not available in locals');
		return { user: null };
	}

	try {
		// Session is already fetched in hooks.server.ts and available in event.locals
		const session = event.locals.user ? { user: event.locals.user } : null;

		// Protect all routes except /login and /register by default
		const isPublicRoute =
			event.route.id === '/login' ||
			event.route.id === '/register' ||
			event.route.id === '/' ||
			event.url.pathname.startsWith('/api/');

		if (!session && !isPublicRoute) {
			throw redirect(302, routes.login);
		}

		return {
			user: session?.user ?? null
		};
	} catch (error) {
		// Re-throw redirects (they're expected)
		if (error instanceof Response && error.status === 302) {
			throw error;
		}
		console.error('Auth error:', error);
		return { user: null };
	}
};
