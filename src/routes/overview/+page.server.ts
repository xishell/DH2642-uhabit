import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { routes } from '$lib/routes';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication to access overview page
	if (!locals.user) {
		throw redirect(302, routes.login);
	}

	// Return user data to the page
	return {
		user: locals.user
	};
};
