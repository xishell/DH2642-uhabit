import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
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

		const res = await fetch('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habit)
		});
		console.log('Status code from /api/habits POST:', res.status);
		const resBody = await res.text();
		console.log('Response body:', resBody);

		throw redirect(303, '/planning');
	}
};
