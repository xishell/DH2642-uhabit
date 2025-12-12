/**
 * Centralized route definitions.
 * Change paths here to update them across the entire app.
 */

export const routes = {
	login: '/login',
	register: '/register',
	overview: '/overview',
	habits: {
		list: '/habits'
	},
	goals: {
		list: '/goals'
	}
} as const;
