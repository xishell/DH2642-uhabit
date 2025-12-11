import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';

type QuoteData = { quote?: string | null; author?: string | null };

const QUOTE_CACHE_KEY = 'uhabit-quote';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	// Read tab state from cookie
	const savedTab = cookies.get('habits-tab');
	const initialTab: 0 | 1 = savedTab === 'goals' ? 1 : 0;

	// Use cached quote from cookie to avoid skeleton flash
	let quote: string | null = null;
	let author: string | null = null;
	const quoteCookie = cookies.get(QUOTE_CACHE_KEY);
	if (quoteCookie) {
		try {
			const parsed = JSON.parse(quoteCookie) as { quote?: string | null; author?: string | null };
			quote = parsed.quote ?? null;
			author = parsed.author ?? null;
		} catch {
			quote = null;
			author = null;
		}
	}

	// Fetch habits and goals in parallel
	const [habitsRes, goalsRes] = await Promise.all([fetch('/api/habits'), fetch('/api/goals')]);

	const habitsData = habitsRes.ok ? await habitsRes.json() : [];
	const goalsData = goalsRes.ok ? await goalsRes.json() : [];

	const habits = Array.isArray(habitsData)
		? (habitsData as Habit[]).sort((a, b) => a.title.localeCompare(b.title))
		: [];
	const goals = Array.isArray(goalsData) ? (goalsData as GoalWithProgress[]) : [];

	// If no cookie, fall back to server-side cached quote endpoint
	if (!quote) {
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
	}

	return {
		habits,
		goals,
		quote,
		author,
		initialTab
	};
};
