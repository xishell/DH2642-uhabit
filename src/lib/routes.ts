/**
 * Centralized route definitions.
 * Change paths here to update them across the entire app.
 */

export type HabitType = 'progressive' | 'single';

export const routes = {
	login: '/login',
	register: '/register', // <-- add this line
	overview: '/overview',
	habits: {
		list: '/habits',
		new: (type: HabitType) => `/habits/new?type=${type}`,
		edit: (id: string, type: string) => `/habits/${id}?type=${type}`,
		listWithTab: (type: HabitType) => `/habits?tab=${type}`
	}
} as const;
