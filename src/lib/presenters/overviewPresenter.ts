import { writable } from 'svelte/store';
import type { HabitWithStatus } from '$lib/types/habit';
import type { GoalWithHabitStatus } from '$lib/types/goal';
import { setCookie, setJsonCookie, deleteCookie } from '$lib/utils/cookie';

export type OverviewState = {
	activeTab: 'tasks' | 'goals';
	habits: HabitWithStatus[]; // All habits due today
	goals: GoalWithHabitStatus[]; // Active goals with today's status
	showDetail: boolean;
	selectedProgressive: HabitWithStatus | null;
	modalProgress: number | null;
	error: string | null;
};

type OverviewPresenterDeps = {
	initial: {
		habits: HabitWithStatus[];
		goals: GoalWithHabitStatus[];
		initialTab: 'tasks' | 'goals';
		initialModal: { habitId: string; progress: number } | null;
	};
	fetcher: typeof fetch;
	browser: boolean;
};

export function createOverviewPresenter({ initial, fetcher, browser }: OverviewPresenterDeps) {
	const baseState: OverviewState = {
		activeTab: initial.initialTab,
		habits: initial.habits.map((h) => ({ ...h })),
		goals: initial.goals.map((g) => ({ ...g })),
		showDetail: false,
		selectedProgressive: null,
		modalProgress: null,
		error: null
	};

	// Restore modal if server provided valid cookie-backed state
	if (initial.initialModal) {
		const match = baseState.habits
			.filter((h) => h.habit.measurement === 'numeric')
			.find((p) => p.habit.id === initial.initialModal!.habitId);
		if (match) {
			baseState.selectedProgressive = { ...match, habit: { ...match.habit } };
			baseState.modalProgress = initial.initialModal.progress;
			baseState.showDetail = true;
		} else if (browser) {
			deleteCookie('overview-modal');
		}
	}

	const { subscribe, update, set } = writable<OverviewState>(baseState);

	const setError = (message: string, timeout = 3000) => {
		update((state) => ({ ...state, error: message }));
		if (timeout > 0) {
			setTimeout(() => {
				update((state) => (state.error === message ? { ...state, error: null } : state));
			}, timeout);
		}
	};

	const syncFromServer = (data: OverviewPresenterDeps['initial']) => {
		set({
			activeTab: data.initialTab,
			habits: data.habits.map((h) => ({ ...h })),
			goals: data.goals.map((g) => ({ ...g })),
			showDetail: false,
			selectedProgressive: null,
			modalProgress: null,
			error: null
		});
	};

	const getState = () => {
		let current: OverviewState;
		subscribe((v) => (current = v))();
		// @ts-expect-error - current is assigned synchronously above
		return current as OverviewState;
	};

	const openProgressive = (p: HabitWithStatus) => {
		update((state) => ({
			...state,
			selectedProgressive: { ...p, habit: { ...p.habit } },
			modalProgress: null,
			showDetail: true
		}));
		if (browser) {
			setJsonCookie('overview-modal', { habitId: p.habit.id, progress: p.progress });
		}
	};

	const closeDetail = () => {
		update((state) => ({
			...state,
			showDetail: false,
			selectedProgressive: null,
			modalProgress: null
		}));
		if (browser) {
			deleteCookie('overview-modal');
		}
	};

	const onModalProgressChange = (progress: number) => {
		update((state) => ({ ...state, modalProgress: progress }));
		if (browser) {
			const { selectedProgressive } = getState();
			if (selectedProgressive) {
				setJsonCookie('overview-modal', {
					habitId: selectedProgressive.habit.id,
					progress
				});
			}
		}
	};

	const toggleSingleOptimistic = (habitId: string): HabitWithStatus[] => {
		const previous = getState().habits;
		update((state) => ({
			...state,
			habits: state.habits.map((h) =>
				h.habit.id === habitId ? { ...h, isCompleted: !h.isCompleted } : h
			)
		}));
		return previous;
	};

	const revertHabits = (previous: HabitWithStatus[]) => {
		update((state) => ({ ...state, habits: previous }));
	};

	const saveProgressive = async (updated: HabitWithStatus) => {
		const prevState = getState().habits;

		update((state) => ({
			...state,
			habits: state.habits.map((h) => (h.habit.id === updated.habit.id ? { ...updated } : h))
		}));
		closeDetail();

		try {
			const form = new FormData();
			form.append('id', updated.habit.id);
			form.append('progress', updated.progress.toString());
			const response = await fetcher('?/updateProgressValue', { method: 'POST', body: form });

			if (!response.ok) {
				throw new Error('Failed to save progress');
			}
		} catch (error) {
			update((state) => ({ ...state, habits: prevState }));
			setError('Failed to save progress. Please try again.');
			console.error('Progress save error:', error);
		}
	};

	const setActiveTab = (val: 0 | 1) => {
		const activeTab = val === 0 ? 'tasks' : 'goals';
		update((state) => ({ ...state, activeTab }));
		if (browser) {
			setCookie('overview-tab', activeTab);
		}
	};

	// Derived helpers
	const getBooleanHabits = () => getState().habits.filter((h) => h.habit.measurement === 'boolean');
	const getNumericHabits = () => getState().habits.filter((h) => h.habit.measurement === 'numeric');

	return {
		state: { subscribe },
		syncFromServer,
		openProgressive,
		closeDetail,
		onModalProgressChange,
		toggleSingleOptimistic,
		revertHabits,
		saveProgressive,
		setActiveTab,
		showError: setError,
		getBooleanHabits,
		getNumericHabits
	};
}
