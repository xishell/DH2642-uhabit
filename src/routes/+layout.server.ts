import type { LayoutServerLoad } from './$types';
import { createAuth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
	const db = event.platform?.env?.DB;
	const secret = event.platform?.env?.BETTER_AUTH_SECRET;
	const baseUrl = event.url.origin;

	if (!db || !secret) {
		console.error('Missing DB or BETTER_AUTH_SECRET in runtime environment');
		return { user: null };
	}

	try {
		const auth = createAuth(db, secret, baseUrl);
		const session = await auth.api.getSession(event.request);

		// Protect all routes except /auth/* by default
		const isPublicRoute = event.route.id?.startsWith('/auth');

		if (!session && !isPublicRoute) {
			throw redirect(302, '/auth/login');
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
