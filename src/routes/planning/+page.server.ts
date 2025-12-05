import type { PageServerLoad } from './$types';
export type Habit = {
	id: string;
	userId: string;
	title: string;
	notes: string | null;
	color: string | null;
	frequency: 'daily' | 'weekly' | 'monthly';
	measurement: 'boolean' | 'numeric';
	period: number[] | null;
	targetAmount: number | null;
	unit: string | null;
	categoryId: string | null;
	goalId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export const load: PageServerLoad = async ({ fetch }) => {
	const habits = (await fetch('/api/habits').then((r) => r.json())) as Habit[];

	const progressiveHabitList = habits
		.filter((h: any) => h.measurement === 'numeric')
		.map((h: any) => h.title);

	const singleStepHabitList = habits
		.filter((h: any) => h.measurement === 'boolean')
		.map((h: any) => h.title);

	return {
		progressiveHabitList,
		singleStepHabitList
	};
};
