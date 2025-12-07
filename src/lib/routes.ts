/**
 * Centralized route definitions.
 * Change paths here to update them across the entire app.
 */

export type HabitType = 'progressive' | 'single';

export const routes = {
	login: '/login',
	overview: '/overview',

	habits: {
		list: '/habits',
		new: (type: HabitType) => `/habits/new?type=${type}`,
		edit: (id: string, type: string) => `/habits/${id}?type=${type}`,
		/** Returns list path with hash for tab state */
		listWithTab: (type: HabitType) =>
			`/habits${type === 'single' ? '#single-step' : '#progressive'}`
	}
} as const;
