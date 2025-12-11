import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { routes } from '$lib/routes';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();

		const raw = data.get('period') as string;
		const periodArray = raw ? raw.split(',').map(Number) : [];

		// Derive measurement type from form data:
		// If both targetAmount AND unit are provided → 'numeric', else → 'boolean'
		const targetAmountRaw = data.get('targetAmount') as string;
		const unitRaw = data.get('unit') as string;
		const hasTarget = targetAmountRaw && targetAmountRaw.trim() !== '';
		const hasUnit = unitRaw && unitRaw.trim() !== '';
		const isNumeric = hasTarget && hasUnit;

		const habit = {
			title: data.get('title') as string,
			notes: data.get('notes') as string,
			color: data.get('color') as string,
			frequency: data.get('frequency') as string,
			period: periodArray,
			measurement: isNumeric ? 'numeric' : 'boolean',
			targetAmount: isNumeric ? Number(targetAmountRaw) : null,
			unit: isNumeric ? unitRaw : null
		};

		const res = await fetch('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habit)
		});

		if (!res.ok) {
			const message = await res.text();
			return fail(res.status, {
				error: message || 'Failed to create habit'
			});
		}

		// Redirect back to habits list
		throw redirect(303, routes.habits.list);
	}
};
