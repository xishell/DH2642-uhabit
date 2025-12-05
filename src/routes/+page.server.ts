import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is not authenticated, redirect to login
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// If user is authenticated, redirect to overview (the main app page)
	throw redirect(302, '/overview');
};
