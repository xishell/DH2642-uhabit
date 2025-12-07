import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { routes, type HabitType } from '$lib/routes';
import type { Habit } from '$lib/types/habit';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const res = await fetch(`/api/habits/${params.id}`);

	if (!res.ok) {
		return {
			targetHabit: null,
			loadError: res.status === 404 ? 'Habit not found' : 'Failed to load habit'
		};
	}

	const targetHabit = (await res.json()) as Habit;

	return {
		targetHabit
	};
};

export const actions: Actions = {
	// UPDATE habit
	default: async ({ request, fetch, params, url }) => {
		const id = params.id;
		const type = (url.searchParams.get('type') as HabitType) || 'progressive';
		const data = await request.formData();

		const raw = data.get('period') as string;
		const periodArray = raw ? raw.split(',').map(Number) : [];
		const isNumeric = data.get('measurement') === 'numeric';
		const habit: Record<string, unknown> = {
			title: data.get('title') as string,
			notes: data.get('notes') as string,
			color: data.get('color') as string,
			frequency: data.get('frequency') as string,
			period: periodArray,
			measurement: data.get('measurement') as string
		};

		// Only include numeric fields when needed to avoid touching DB columns unnecessarily
		if (isNumeric) {
			habit.targetAmount = Number(data.get('targetAmount'));
			habit.unit = data.get('unit');
		}

		const res = await fetch(`/api/habits/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habit)
		});

		if (!res.ok) {
			const message = await res.text();
			return fail(res.status, {
				error: message || 'Failed to update habit'
			});
		}

		// Redirect back to habits list with correct tab
		throw redirect(303, routes.habits.listWithTab(type));
	},

	// DELETE habit
	delete: async ({ fetch, params, url }) => {
		const id = params.id;
		const type = (url.searchParams.get('type') as HabitType) || 'progressive';

		const res = await fetch(`/api/habits/${id}`, {
			method: 'DELETE'
		});

		if (!res.ok) {
			const text = await res.text();
			return fail(res.status, { error: text || 'Failed to delete habit' });
		}

		throw redirect(303, routes.habits.listWithTab(type));
	}
};
