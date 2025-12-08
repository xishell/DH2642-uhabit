import type { Habit } from '$lib/types/habit';

export const load = ({ data }: { data: { user: any; single: Habit[]; progressive: Habit[] } }) => {
	return {
		user: data.user,
		single: data.single,
		progressive: data.progressive
	};
};
