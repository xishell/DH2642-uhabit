import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/habits');
	const data = res.ok ? await res.json() : [];
	const habits = Array.isArray(data) ? (data as Habit[]) : [];

	const progressiveHabitList = habits.filter((h: Habit) => h.measurement === 'numeric');

	const singleStepHabitList = habits.filter((h: Habit) => h.measurement === 'boolean');

	return {
		progressiveHabitList,
		singleStepHabitList
	};
};
