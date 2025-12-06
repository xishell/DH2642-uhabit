//UPDATE habits
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, fetch, params }) => {
		const id = params.id;
		const data = await request.formData();

		const raw = data.get('period') as string;
		const periodArray = raw ? raw.split(',').map(Number) : [];
		const isNumeric = data.get('measurement') === 'numeric';
		const habit = {
			title: data.get('title') as string,
			notes: data.get('notes') as string,
			color: data.get('color') as string,
			frequency: data.get('frequency') as string,
			period: JSON.stringify(periodArray),
			measurement: data.get('measurement') as string,
			targetAmount: isNumeric ? Number(data.get('targetAmount')) : null,
			unit: isNumeric ? data.get('unit') : null
		};

		const res = await fetch('/api/habits/{$id}', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habit)
		});

		console.log('Status code from /api/habits/[id] UPDATE:', res.status);
		const resBody = await res.text();
		console.log('Response body:', resBody);

		throw redirect(303, '/planning');
	}
};

//GET habits
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

	const progressiveHabitList = habits.filter((h: any) => h.measurement === 'numeric');

	const singleStepHabitList = habits.filter((h: any) => h.measurement === 'boolean');

	return {
		progressiveHabitList,
		singleStepHabitList
	};
};
