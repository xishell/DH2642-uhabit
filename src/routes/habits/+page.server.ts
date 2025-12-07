import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';

type QuoteData = { quote?: string | null; author?: string | null };

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/habits');
	const data = res.ok ? await res.json() : [];
	const habits = Array.isArray(data) ? (data as Habit[]) : [];

	const progressiveHabitList = habits.filter((h: Habit) => h.measurement === 'numeric');
	const singleStepHabitList = habits.filter((h: Habit) => h.measurement === 'boolean');

	let quote: string | null = null;
	let author: string | null = null;
	try {
		const quoteRes = await fetch('/api-external/quotes?cacheOnly=1');
		if (quoteRes.ok && quoteRes.status === 200) {
			const body = (await quoteRes.json()) as QuoteData;
			quote = body?.quote ?? null;
			author = body?.author ?? null;
		}
	} catch (e) {
		console.error('Failed to load cached quote', e);
	}

	return {
		progressiveHabitList,
		singleStepHabitList,
		quote,
		author
	};
};
