import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';

type QuoteData = { quote?: string | null; author?: string | null };

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Read tab state from cookie
	const savedTab = cookies.get('habits-tab');
	const initialTab: 0 | 1 = savedTab === 'goals' ? 1 : 0;

	// Fetch habits and goals in parallel
	const [habitsRes, goalsRes] = await Promise.all([fetch('/api/habits'), fetch('/api/goals')]);

	const habitsData = habitsRes.ok ? await habitsRes.json() : [];
	const goalsData = goalsRes.ok ? await goalsRes.json() : [];

	const habits = Array.isArray(habitsData)
		? (habitsData as Habit[]).sort((a, b) => a.title.localeCompare(b.title))
		: [];
	const goals = Array.isArray(goalsData) ? (goalsData as GoalWithProgress[]) : [];

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
		habits,
		goals,
		quote,
		author,
		initialTab
	};
};
