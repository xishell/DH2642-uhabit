import { writable } from 'svelte/store';
import type { Habit } from '$lib/types/habit';

type HabitsState = {
	progressive: Habit[];
	single: Habit[];
	loading: boolean;
	error: string | null;
};

const createHabitsStore = () => {
	const { subscribe, update, set } = writable<HabitsState>({
		progressive: [],
		single: [],
		loading: true,
		error: null
	});

	const load = async () => {
		set({ progressive: [], single: [], loading: true, error: null });
		try {
			const res = await fetch('/api/habits');
			if (!res.ok) {
				throw new Error('Failed to load habits');
			}
			const data = await res.json();
			const habits = Array.isArray(data) ? (data as Habit[]) : [];

			const progressive = habits.filter((h) => h.measurement === 'numeric');
			const single = habits.filter((h) => h.measurement === 'boolean');

			set({ progressive, single, loading: false, error: null });
		} catch (err) {
			update((state) => ({
				...state,
				loading: false,
				error: 'Could not load habits',
				progressive: [],
				single: []
			}));
			console.error('Habit load error', err);
		}
	};

	const refresh = () => load();

	const invalidate = () => {
		set({ progressive: [], single: [], loading: true, error: null });
	};

	const init = (progressive: Habit[], single: Habit[]) => {
		set({ progressive, single, loading: false, error: null });
	};

	return { subscribe, load, refresh, invalidate, init };
};

export const habitsStore = createHabitsStore();
