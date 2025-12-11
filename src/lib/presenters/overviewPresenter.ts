import { writable } from 'svelte/store';
import type { HabitWithStatus } from '$lib/types/habit';
import type { GoalWithHabitStatus } from '$lib/types/goal';
import { setCookie } from '$lib/utils/cookie';
import { createModalManager } from '$lib/utils/modalManager';

export type OverviewState = {
	activeTab: 'habits' | 'goals';
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
		initialTab: 'habits' | 'goals';
		initialModal: { habitId: string; progress: number } | null;
	};
	fetcher: typeof fetch;
	browser: boolean;
};

export function createOverviewPresenter({ initial, fetcher, browser }: OverviewPresenterDeps) {
	const progressiveModal = createModalManager<HabitWithStatus & { id: string }>({
		browser,
		cookieKey: 'overview-modal'
	});

	const toModalItem = (h: HabitWithStatus): HabitWithStatus & { id: string } => ({
		...h,
		id: h.habit.id
	});

	const restoredModal = initial.initialModal
		? progressiveModal.restore(
				initial.habits.filter((h) => h.habit.measurement === 'numeric').map(toModalItem)
			)
		: progressiveModal.getState();

	const baseState: OverviewState = {
		activeTab: initial.initialTab,
		habits: initial.habits.map((h) => ({ ...h })),
		goals: initial.goals.map((g) => ({ ...g })),
		showDetail: restoredModal.open && !!restoredModal.editing,
		selectedProgressive: restoredModal.editing,
		modalProgress: restoredModal.editing ? (initial.initialModal?.progress ?? null) : null,
		error: null
	};

	const { subscribe, update, set } = writable<OverviewState>(baseState);
	// Store last partial progress to restore when toggling off
	const previousProgress = new Map<string, number>();

	const getState = () => {
		let current: OverviewState;
		subscribe((v) => (current = v))();
		// @ts-expect-error - current is assigned synchronously above
		return current as OverviewState;
	};

	const setError = (message: string, timeout = 3000) => {
		update((state) => ({ ...state, error: message }));
		if (timeout > 0) {
			setTimeout(() => {
				update((state) => (state.error === message ? { ...state, error: null } : state));
			}, timeout);
		}
	};

	const syncFromServer = (data: OverviewPresenterDeps['initial']) => {
		const current = getState();
		const nextHabits = data.habits.map((h) => ({ ...h }));
		const nextGoals = data.goals.map((g) => ({ ...g }));

		const syncedModal = progressiveModal.sync(
			nextHabits.filter((h) => h.habit.measurement === 'numeric').map(toModalItem)
		);

		set({
			activeTab: data.initialTab,
			habits: nextHabits,
			goals: nextGoals,
			showDetail: syncedModal.open && !!syncedModal.editing,
			selectedProgressive: syncedModal.editing,
			modalProgress: syncedModal.editing ? current.modalProgress : null,
			error: null
		});
	};

	const openProgressive = (p: HabitWithStatus) => {
		const modalState = progressiveModal.open({ ...p, habit: { ...p.habit }, id: p.habit.id });
		update((state) => ({
			...state,
			selectedProgressive: modalState.editing,
			modalProgress: null,
			showDetail: modalState.open
		}));
	};

	const closeDetail = () => {
		const modalState = progressiveModal.close();
		update((state) => ({
			...state,
			showDetail: modalState.open,
			selectedProgressive: modalState.editing,
			modalProgress: null
		}));
	};

	const onModalProgressChange = (progress: number) => {
		update((state) => ({ ...state, modalProgress: progress }));
	};

	// Helper to recalculate goal stats based on current habits
	const recalculateGoals = (
		goals: GoalWithHabitStatus[],
		habits: HabitWithStatus[]
	): GoalWithHabitStatus[] => {
		const completionUnits = (h: HabitWithStatus) => {
			if (h.habit.measurement === 'boolean') {
				return h.isCompleted ? 1 : 0;
			}
			const target = h.target ?? h.habit.targetAmount ?? 0;
			if (target <= 0) return h.isCompleted ? 1 : 0;
			return Math.min(1, h.progress / target);
		};

		return goals.map((goal) => {
			// Update habits within this goal with current status
			const updatedGoalHabits = goal.habits.map((gh) => {
				const currentHabit = habits.find((h) => h.habit.id === gh.habit.id);
				return currentHabit ? { ...currentHabit } : gh;
			});

			const todayTotal = updatedGoalHabits.length;
			const todayCompleted = updatedGoalHabits.reduce((sum, h) => sum + completionUnits(h), 0);
			const progressPercentage = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

			return {
				...goal,
				habits: updatedGoalHabits,
				todayCompleted,
				todayTotal,
				totalCompleted: todayCompleted,
				totalScheduled: todayTotal,
				progressPercentage,
				isCompleted: todayTotal > 0 && todayCompleted >= todayTotal
			};
		});
	};

	const toggleSingleOptimistic = (
		habitId: string
	): { habits: HabitWithStatus[]; goals: GoalWithHabitStatus[] } => {
		const state = getState();
		const previousHabits = state.habits;
		const previousGoals = state.goals;

		const updatedHabits = state.habits.map((h) =>
			h.habit.id === habitId ? { ...h, isCompleted: !h.isCompleted } : h
		);

		update((s) => ({
			...s,
			habits: updatedHabits,
			goals: recalculateGoals(s.goals, updatedHabits)
		}));

		return { habits: previousHabits, goals: previousGoals };
	};

	const revertHabits = (previous: { habits: HabitWithStatus[]; goals: GoalWithHabitStatus[] }) => {
		update((state) => ({ ...state, habits: previous.habits, goals: previous.goals }));
	};

	const saveProgressive = async (updated: HabitWithStatus) => {
		const state = getState();
		const prevHabits = state.habits;
		const prevGoals = state.goals;

		const updatedHabits = state.habits.map((h) =>
			h.habit.id === updated.habit.id ? { ...updated } : h
		);

		update((s) => ({
			...s,
			habits: updatedHabits,
			goals: recalculateGoals(s.goals, updatedHabits)
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
			update((s) => ({ ...s, habits: prevHabits, goals: prevGoals }));
			setError('Failed to save progress. Please try again.');
			console.error('Progress save error:', error);
		}
	};

	const toggleProgressiveComplete = async (habitStatus: HabitWithStatus) => {
		const state = getState();
		const prevHabits = state.habits;
		const prevGoals = state.goals;

		const target = habitStatus.target ?? habitStatus.habit.targetAmount ?? 0;
		if (target <= 0) {
			setError('Cannot toggle without a target amount.');
			return;
		}

		const currentlyCompleted = habitStatus.progress >= target;
		if (!currentlyCompleted) {
			previousProgress.set(habitStatus.habit.id, habitStatus.progress);
		}
		const restored = previousProgress.get(habitStatus.habit.id) ?? 0;
		const newProgress = currentlyCompleted ? restored : target;
		const updatedHabit = {
			...habitStatus,
			progress: newProgress,
			isCompleted: newProgress >= target
		};

		const updatedHabits = state.habits.map((h) =>
			h.habit.id === habitStatus.habit.id ? updatedHabit : h
		);

		update((s) => ({
			...s,
			habits: updatedHabits,
			goals: recalculateGoals(s.goals, updatedHabits)
		}));

		try {
			const form = new FormData();
			form.append('id', habitStatus.habit.id);
			form.append('progress', newProgress.toString());
			const response = await fetcher('?/updateProgressValue', { method: 'POST', body: form });

			if (!response.ok) {
				throw new Error('Failed to save progress');
			}
		} catch (error) {
			update((s) => ({ ...s, habits: prevHabits, goals: prevGoals }));
			setError('Failed to update task. Please try again.');
			console.error('Progress toggle error:', error);
		}
	};

	const setActiveTab = (val: 0 | 1) => {
		const activeTab = val === 0 ? 'habits' : 'goals';
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
		toggleProgressiveComplete,
		setActiveTab,
		showError: setError,
		getBooleanHabits,
		getNumericHabits
	};
}
