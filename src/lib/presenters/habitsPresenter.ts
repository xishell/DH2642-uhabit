import { writable } from 'svelte/store';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';
import { setCookie } from '$lib/utils/cookie';

type QuoteData = { quote?: string | null; author?: string | null };

export type HabitsState = {
	habits: Habit[];
	goals: GoalWithProgress[];
	activeTab: 0 | 1; // 0 = Tasks, 1 = Goals
	habitsLoading: boolean;
	habitsError: string | null;
	quote: string;
	author: string;
	isQuoteLoading: boolean;
};

type HabitsPresenterDeps = {
	initial: {
		habits: Habit[];
		goals: GoalWithProgress[];
		quote: string | null;
		author: string | null;
		initialTab: 0 | 1;
	};
	fetcher: typeof fetch;
	browser: boolean;
	storage: Storage | null;
};

const QUOTE_CACHE_KEY = 'uhabit-quote';

export function createHabitsPresenter({ initial, fetcher, browser, storage }: HabitsPresenterDeps) {
	const { subscribe, update } = writable<HabitsState>({
		habits: initial.habits,
		goals: initial.goals,
		activeTab: initial.initialTab,
		habitsLoading: false,
		habitsError: null,
		quote: initial.quote ?? 'Let your days echo with the steps you choose to take.',
		author: initial.author ?? '',
		isQuoteLoading: !initial.quote
	});

	const getState = () => {
		let current: HabitsState;
		subscribe((v) => (current = v))();
		// @ts-expect-error - assigned above
		return current as HabitsState;
	};

	const initData = (habits: Habit[], goals: GoalWithProgress[]) => {
		update((state) => ({
			...state,
			habits,
			goals,
			habitsLoading: false,
			habitsError: null
		}));
	};

	const setActiveTab = (val: 0 | 1) => {
		update((state) => ({ ...state, activeTab: val }));
		if (browser) {
			setCookie('habits-tab', val === 1 ? 'goals' : 'tasks');
		}
	};

	const refreshData = async () => {
		update((state) => ({ ...state, habitsLoading: true, habitsError: null }));
		try {
			const [habitsRes, goalsRes] = await Promise.all([
				fetcher('/api/habits'),
				fetcher('/api/goals')
			]);

			if (!habitsRes.ok || !goalsRes.ok) {
				throw new Error('Failed to load data');
			}

			const habits = (await habitsRes.json()) as Habit[];
			const goals = (await goalsRes.json()) as GoalWithProgress[];

			update((state) => ({
				...state,
				habits: habits.sort((a, b) => a.title.localeCompare(b.title)),
				goals,
				habitsLoading: false
			}));
		} catch (error) {
			update((state) => ({
				...state,
				habitsLoading: false,
				habitsError: 'Could not load data.'
			}));
			console.error('Data load error:', error);
		}
	};

	const readCachedQuote = (): QuoteData | null => {
		if (!browser || !storage) return null;
		try {
			const raw = storage.getItem(QUOTE_CACHE_KEY);
			return raw ? (JSON.parse(raw) as QuoteData) : null;
		} catch (error) {
			console.error('Failed to read cached quote', error);
			storage.removeItem(QUOTE_CACHE_KEY);
			return null;
		}
	};

	const writeCachedQuote = (quote: string, author: string) => {
		if (!browser || !storage) return;
		try {
			storage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ quote, author }));
		} catch (error) {
			console.error('Failed to cache quote', error);
		}
	};

	const ensureQuote = async () => {
		const state = getState();
		if (state.quote && !state.isQuoteLoading) return;

		const cached = readCachedQuote();
		if (cached?.quote) {
			update((s) => ({
				...s,
				quote: cached.quote || s.quote,
				author: cached.author || s.author,
				isQuoteLoading: false
			}));
			return;
		}

		update((s) => ({ ...s, isQuoteLoading: true }));
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 1200);
			const res = await fetcher('/api-external/quotes', { signal: controller.signal });
			clearTimeout(timeout);
			if (!res.ok) throw new Error('Quote fetch failed');
			const body = (await res.json()) as QuoteData;
			if (body?.quote) {
				update((s) => ({
					...s,
					quote: body.quote || s.quote,
					author: body.author ?? '',
					isQuoteLoading: false
				}));
				writeCachedQuote(body.quote, body.author ?? '');
			} else {
				update((s) => ({ ...s, isQuoteLoading: false }));
			}
		} catch (error) {
			update((s) => ({ ...s, isQuoteLoading: false }));
			console.error('Quote fetch error:', error);
		}
	};

	return {
		state: { subscribe },
		initData,
		setActiveTab,
		refreshData,
		ensureQuote
	};
}
