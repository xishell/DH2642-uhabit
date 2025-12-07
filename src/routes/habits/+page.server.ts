import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';

export const load: PageServerLoad = async ({ fetch }) => {
	const habits = (await fetch('/api/habits').then((r) => r.json())) as Habit[];

	const progressiveHabitList = habits.filter((h: any) => h.measurement === 'numeric');

	const singleStepHabitList = habits.filter((h: any) => h.measurement === 'boolean');

	return {
		progressiveHabitList,
		singleStepHabitList
	};
};
