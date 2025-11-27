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

	const auth = createAuth(db, secret, baseUrl);

	const session = await auth.api.getSession(event.request);

	const isProtected = event.route.id && !event.route.id.startsWith('/auth');

	if (!session && isProtected) {
		throw redirect(302, '/auth/login');
	}

	return {
		user: session?.user ?? null
	};
};
