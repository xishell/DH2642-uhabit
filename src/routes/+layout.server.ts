import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Auth and route protection is handled in hooks.server.ts
	// This just passes the user data to all pages
	return {
		user: event.locals.user ?? null
	};
};
