import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();

		const raw = data.get('period') as string;
		const periodArray = raw ? raw.split(',').map(Number) : [];
		const habit = {
			title: data.get('title') as string,
			notes: data.get('notes') as string,
			color: data.get('color') as string,
			frequency: data.get('frequency') as string,
			period: JSON.stringify(periodArray),
			measurement: data.get('measurement') as string,
			targetAmount: Number(data.get('targetAmount')),
			unit: data.get('unit') as string
		};

		const res = await fetch('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habit)
		});
		console.log('Status code from /api/habits POST:', res.status);
		const resBody = await res.text(); // 先用 text() 打印原始数据
		console.log('Response body:', resBody);

		return { success: true };
	}
};
