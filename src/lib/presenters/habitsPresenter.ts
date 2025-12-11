import { writable } from 'svelte/store';
import type { Habit } from '$lib/types/habit';
import type { GoalWithProgress } from '$lib/types/goal';
import { setCookie, setJsonCookie, deleteCookie, getJsonCookie } from '$lib/utils/cookie';
import { createModalManager } from '$lib/utils/modalManager';

type QuoteData = { quote?: string | null; author?: string | null };

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

const QUOTE_CACHE_KEY = 'uhabit-quote';
const MODAL_COOKIE_KEY = 'habits-modal';
const HABIT_MODAL_COOKIE = 'habits-modal-habit';
const GOAL_MODAL_COOKIE = 'habits-modal-goal';

export function createHabitsPresenter({ initial, fetcher, browser, storage }: HabitsPresenterDeps) {
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
			setJsonCookie(QUOTE_CACHE_KEY, { quote, author });
		} catch (error) {
			console.error('Failed to cache quote', error);
		}
	};

	const cachedQuote = browser ? readCachedQuote() : null;
	const initialQuote =
		initial.quote ?? cachedQuote?.quote ?? 'Let your days echo with the steps you choose to take.';
	const initialAuthor = initial.author ?? cachedQuote?.author ?? '';
	const initialQuoteLoading = !(initial.quote || cachedQuote?.quote);

	const habitModal = createModalManager<Habit>({ browser, cookieKey: HABIT_MODAL_COOKIE });
	const goalModal = createModalManager<GoalWithProgress>({ browser, cookieKey: GOAL_MODAL_COOKIE });
	const restoredHabitModal = habitModal.restore(initial.habits);
	const restoredGoalModal = goalModal.restore(initial.goals);

	const { subscribe, update } = writable<HabitsState>({
		habits: initial.habits,
		goals: initial.goals,
		activeTab: initial.initialTab,
		habitsLoading: false,
		habitsError: null,
		quote: initialQuote,
		author: initialAuthor,
		isQuoteLoading: initialQuoteLoading,
		showHabitModal: restoredHabitModal.open,
		showGoalModal: restoredGoalModal.open,
		editingHabit: restoredHabitModal.editing,
		editingGoal: restoredGoalModal.editing
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

	const syncFromServer = (habits: Habit[], goals: GoalWithProgress[]) => {
		update((state) => {
			const nextHabits = habits.map((h) => ({ ...h }));
			const nextGoals = goals.map((g) => ({ ...g }));

			const nextEditingHabit =
				state.showHabitModal && state.editingHabit
					? nextHabits.find((h) => h.id === state.editingHabit!.id) ?? state.editingHabit
					: null;
			const nextEditingGoal =
				state.showGoalModal && state.editingGoal
					? nextGoals.find((g) => g.id === state.editingGoal!.id) ?? state.editingGoal
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
			setCookie('habits-tab', val === 1 ? 'goals' : 'habits');
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

	// Restore modal state from cookie (browser only)
	if (browser) {
		const modalCookie = getJsonCookie<{ type: 'habit' | 'goal'; id: string | null }>(
			MODAL_COOKIE_KEY
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
		state: { subscribe },
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
