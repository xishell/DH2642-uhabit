import { writable } from 'svelte/store';
import type { HabitWithStatus } from '$lib/types/habit';
import { setCookie, setJsonCookie, deleteCookie } from '$lib/utils/cookie';

export type OverviewState = {
	activeTab: 'single' | 'progressive';
	single: HabitWithStatus[];
	progressive: HabitWithStatus[];
	showDetail: boolean;
	selectedProgressive: HabitWithStatus | null;
	modalProgress: number | null;
	error: string | null;
};

type OverviewPresenterDeps = {
	initial: {
		single: HabitWithStatus[];
		progressive: HabitWithStatus[];
		initialTab: 'single' | 'progressive';
		initialModal: { habitId: string; progress: number } | null;
	};
	fetcher: typeof fetch;
	browser: boolean;
};

export function createOverviewPresenter({ initial, fetcher, browser }: OverviewPresenterDeps) {
	const baseState: OverviewState = {
		activeTab: initial.initialTab,
		single: initial.single.map((s) => ({ ...s })),
		progressive: initial.progressive.map((p) => ({ ...p })),
		showDetail: false,
		selectedProgressive: null,
		modalProgress: null,
		error: null
	};

	// Restore modal if server provided valid cookie-backed state
	if (initial.initialModal) {
		const match = baseState.progressive.find((p) => p.habit.id === initial.initialModal!.habitId);
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
			single: data.single.map((s) => ({ ...s })),
			progressive: data.progressive.map((p) => ({ ...p })),
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
		const previous = getState().single;
		update((state) => ({
			...state,
			single: state.single.map((s) =>
				s.habit.id === habitId ? { ...s, isCompleted: !s.isCompleted } : s
			)
		}));
		return previous;
	};

	const revertSingle = (previous: HabitWithStatus[]) => {
		update((state) => ({ ...state, single: previous }));
	};

	const saveProgressive = async (updated: HabitWithStatus) => {
		const prevState = getState().progressive;

		update((state) => ({
			...state,
			progressive: state.progressive.map((p) =>
				p.habit.id === updated.habit.id ? { ...updated } : p
			)
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
			update((state) => ({ ...state, progressive: prevState }));
			setError('Failed to save progress. Please try again.');
			console.error('Progress save error:', error);
		}
	};

	const setActiveTabFromToggle = (val: 0 | 1) => {
		const activeTab = val === 1 ? 'single' : 'progressive';
		update((state) => ({ ...state, activeTab }));
		if (browser) {
			setCookie('overview-tab', activeTab);
		}
	};

	return {
		state: { subscribe },
		syncFromServer,
		openProgressive,
		closeDetail,
		onModalProgressChange,
		toggleSingleOptimistic,
		revertSingle,
		saveProgressive,
		setActiveTabFromToggle,
		showError: setError
	};
}
