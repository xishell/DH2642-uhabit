import { writable } from 'svelte/store';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';
import { setCookie, getJsonCookie } from '$lib/utils/cookie';
import { createModalManager } from '$lib/utils/modalManager';
import { COOKIES, STORAGE_KEYS } from '$lib/constants';
import { readQuoteCache, writeQuoteCache, type QuoteData } from './quoteCache';

export type HabitsState = {
	habits: Habit[];
	goals: GoalWithProgress[];
	activeTab: 0 | 1; // 0 = Habits, 1 = Goals
	habitsLoading: boolean;
	habitsError: string | null;
	quote: string;
	author: string;
	isQuoteLoading: boolean;
	showHabitModal: boolean;
	showGoalModal: boolean;
	editingHabit: Habit | null;
	editingGoal: GoalWithProgress | null;
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

const hydrateQuote = (
	initial: HabitsPresenterDeps['initial'],
	browser: boolean,
	storage: Storage | null
) => {
	const cachedQuote = browser ? readQuoteCache(storage, browser, STORAGE_KEYS.QUOTE_CACHE) : null;
	const quote =
		initial.quote ?? cachedQuote?.quote ?? 'Let your days echo with the steps you choose to take.';
	const author = initial.author ?? cachedQuote?.author ?? '';
	const isQuoteLoading = !(initial.quote || cachedQuote?.quote);
	return { quote, author, isQuoteLoading };
};

export function createHabitsPresenter({ initial, fetcher, browser, storage }: HabitsPresenterDeps) {
	const { quote, author, isQuoteLoading } = hydrateQuote(initial, browser, storage);

	const habitModal = createModalManager<Habit>({ browser, cookieKey: COOKIES.HABIT_MODAL });
	const goalModal = createModalManager<GoalWithProgress>({
		browser,
		cookieKey: COOKIES.GOAL_MODAL
	});
	const restoredHabitModal = habitModal.restore(initial.habits);
	const restoredGoalModal = goalModal.restore(initial.goals);

	const state = writable<HabitsState>({
		habits: initial.habits,
		goals: initial.goals,
		activeTab: initial.initialTab,
		habitsLoading: false,
		habitsError: null,
		quote,
		author,
		isQuoteLoading,
		showHabitModal: restoredHabitModal.open,
		showGoalModal: restoredGoalModal.open,
		editingHabit: restoredHabitModal.editing,
		editingGoal: restoredGoalModal.editing
	});
	const { subscribe, update, set } = state;

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

	const syncFromServer = (habits: Habit[], goals: GoalWithProgress[]) => {
		update((state) => {
			const nextHabits = habits.map((h) => ({ ...h }));
			const nextGoals = goals.map((g) => ({ ...g }));

			const nextEditingHabit =
				state.showHabitModal && state.editingHabit
					? (nextHabits.find((h) => h.id === state.editingHabit!.id) ?? state.editingHabit)
					: null;
			const nextEditingGoal =
				state.showGoalModal && state.editingGoal
					? (nextGoals.find((g) => g.id === state.editingGoal!.id) ?? state.editingGoal)
					: null;

			return {
				...state,
				habits: nextHabits.sort((a, b) => a.title.localeCompare(b.title)),
				goals: nextGoals,
				habitsLoading: false,
				habitsError: null,
				editingHabit: nextEditingHabit,
				editingGoal: nextEditingGoal
			};
		});
	};

	const setActiveTab = (val: 0 | 1) => {
		update((state) => ({ ...state, activeTab: val }));
		if (browser) {
			setCookie(COOKIES.HABITS_TAB, val === 1 ? 'goals' : 'habits');
		}
	};

	const openHabitModal = (habit?: Habit | null) => {
		const modalState = habitModal.open(habit ?? null);
		update((state) => ({
			...state,
			showHabitModal: modalState.open,
			editingHabit: modalState.editing
		}));
	};

	const closeHabitModal = () => {
		const modalState = habitModal.close();
		update((state) => ({
			...state,
			showHabitModal: modalState.open,
			editingHabit: modalState.editing
		}));
	};

	const openGoalModal = (goal?: GoalWithProgress | null) => {
		const modalState = goalModal.open(goal ?? null);
		update((state) => ({
			...state,
			showGoalModal: modalState.open,
			editingGoal: modalState.editing
		}));
	};

	const closeGoalModal = () => {
		const modalState = goalModal.close();
		update((state) => ({
			...state,
			showGoalModal: modalState.open,
			editingGoal: modalState.editing
		}));
	};

	const getStoredETag = (key: string): string | null => {
		if (!browser || !storage) return null;
		return storage.getItem(key);
	};

	const storeETag = (key: string, etag: string | null) => {
		if (!browser || !storage || !etag) return;
		storage.setItem(key, etag);
	};

	const refreshData = async () => {
		update((state) => ({ ...state, habitsLoading: true, habitsError: null }));
		try {
			const habitsETag = getStoredETag(STORAGE_KEYS.HABITS_ETAG);
			const goalsETag = getStoredETag(STORAGE_KEYS.GOALS_ETAG);

			const habitsHeaders: HeadersInit = {};
			const goalsHeaders: HeadersInit = {};
			if (habitsETag) habitsHeaders['If-None-Match'] = habitsETag;
			if (goalsETag) goalsHeaders['If-None-Match'] = goalsETag;

			const [habitsRes, goalsRes] = await Promise.all([
				fetcher('/api/habits', { headers: habitsHeaders }),
				fetcher('/api/goals', { headers: goalsHeaders })
			]);

			let habits: Habit[];
			if (habitsRes.status === 304) {
				habits = getState().habits;
			} else if (habitsRes.ok) {
				habits = (await habitsRes.json()) as Habit[];
				storeETag(STORAGE_KEYS.HABITS_ETAG, habitsRes.headers.get('ETag'));
			} else {
				throw new Error('Failed to load habits');
			}

			let goals: GoalWithProgress[];
			if (goalsRes.status === 304) {
				goals = getState().goals;
			} else if (goalsRes.ok) {
				goals = (await goalsRes.json()) as GoalWithProgress[];
				storeETag(STORAGE_KEYS.GOALS_ETAG, goalsRes.headers.get('ETag'));
			} else {
				throw new Error('Failed to load goals');
			}

			syncFromServer(habits, goals);
			const habitModalState = habitModal.sync(habits);
			const goalModalState = goalModal.sync(goals);
			update((state) => ({
				...state,
				showHabitModal: habitModalState.open,
				editingHabit: habitModalState.editing,
				showGoalModal: goalModalState.open,
				editingGoal: goalModalState.editing
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

	const ensureQuote = async () => {
		const state = getState();
		if (state.quote && !state.isQuoteLoading) return;

		const cached = readQuoteCache(storage, browser, STORAGE_KEYS.QUOTE_CACHE);
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
				writeQuoteCache(storage, browser, COOKIES.QUOTE_CACHE, body.quote, body.author ?? '');
			} else {
				update((s) => ({ ...s, isQuoteLoading: false }));
			}
		} catch (error) {
			update((s) => ({ ...s, isQuoteLoading: false }));
			console.error('Quote fetch error:', error);
		}
	};

	// Restore modal state from cookie (browser only)
	if (browser) {
		const modalCookie = getJsonCookie<{ type: 'habit' | 'goal'; id: string | null }>(
			COOKIES.HABITS_MODAL
		);
		if (modalCookie) {
			const { type, id } = modalCookie;
			if (type === 'habit') {
				const habit = initial.habits.find((h) => h.id === id) ?? null;
				openHabitModal(habit);
			} else if (type === 'goal') {
				const goal = initial.goals.find((g) => g.id === id) ?? null;
				openGoalModal(goal ?? null);
			}
		}
	}

	return {
		state: { subscribe, set },
		initData,
		setActiveTab,
		refreshData,
		ensureQuote,
		openHabitModal,
		closeHabitModal,
		openGoalModal,
		closeGoalModal
	};
}
