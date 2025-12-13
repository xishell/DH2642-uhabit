import type { PageServerLoad } from './$types';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';
import { COOKIES } from '$lib/constants';

type QuoteData = { quote?: string | null; author?: string | null };

import type { Cookies } from '@sveltejs/kit';

const readTabFromCookie = (cookies: Cookies) =>
	(cookies.get(COOKIES.HABITS_TAB) === 'goals' ? 1 : 0) as 0 | 1;

const readQuoteFromCookie = (cookies: Cookies): QuoteData => {
	const quoteCookie = cookies.get(COOKIES.QUOTE_CACHE);
	if (!quoteCookie) return { quote: null, author: null };
	try {
		const parsed = JSON.parse(quoteCookie) as QuoteData;
		return { quote: parsed.quote ?? null, author: parsed.author ?? null };
	} catch {
		return { quote: null, author: null };
	}
};

const fetchHabitsAndGoals = async (fetchFn: typeof fetch) => {
	const [habitsRes, goalsRes] = await Promise.all([fetchFn('/api/habits'), fetchFn('/api/goals')]);
	const habitsData = habitsRes.ok ? await habitsRes.json() : [];
	const goalsData = goalsRes.ok ? await goalsRes.json() : [];

	const habits = Array.isArray(habitsData)
		? (habitsData as Habit[]).sort((a, b) => a.title.localeCompare(b.title))
		: [];
	const goals = Array.isArray(goalsData) ? (goalsData as GoalWithProgress[]) : [];

	return { habits, goals };
};

const fetchQuoteIfMissing = async (fetchFn: typeof fetch, currentQuote: QuoteData) => {
	if (currentQuote.quote) return currentQuote;
	try {
		const quoteRes = await fetchFn('/api-external/quotes?cacheOnly=1');
		if (quoteRes.ok && quoteRes.status === 200) {
			const body = (await quoteRes.json()) as QuoteData;
			return { quote: body?.quote ?? null, author: body?.author ?? null };
		}
	} catch (e) {
		console.error('Failed to load cached quote', e);
	}
	return currentQuote;
};

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const initialTab = readTabFromCookie(cookies);
	const cookieQuote = readQuoteFromCookie(cookies);

	const [{ habits, goals }, quoteData] = await Promise.all([
		fetchHabitsAndGoals(fetch),
		fetchQuoteIfMissing(fetch, cookieQuote)
	]);

	return {
		habits,
		goals,
		quote: quoteData.quote,
		author: quoteData.author,
		initialTab
	};
};
