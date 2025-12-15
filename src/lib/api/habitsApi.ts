/**
 * API service layer for habits and goals.
 * Handles all HTTP communication with the backend.
 * This is the "Model" layer in MVP architecture.
 */

import type { Habit } from '$lib/types/habit';
import type { Goal, GoalWithProgress } from '$lib/types/goal';

export type Fetcher = typeof fetch;

export interface HabitsApiDeps {
	fetcher: Fetcher;
}

export function createHabitsApi({ fetcher }: HabitsApiDeps) {
	const fetchHabits = async (headers?: HeadersInit): Promise<Response> => {
		return fetcher('/api/habits', { headers });
	};

	const createHabit = async (habitData: Partial<Habit>): Promise<Habit> => {
		const res = await fetcher('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habitData)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to create habit');
		}

		return (await res.json()) as Habit;
	};

	const updateHabit = async (habitId: string, habitData: Partial<Habit>): Promise<Habit> => {
		const res = await fetcher(`/api/habits/${habitId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habitData)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to update habit');
		}

		return (await res.json()) as Habit;
	};

	const deleteHabit = async (habitId: string): Promise<void> => {
		const res = await fetcher(`/api/habits/${habitId}`, { method: 'DELETE' });

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to delete habit');
		}
	};

	const fetchGoals = async (headers?: HeadersInit): Promise<Response> => {
		return fetcher('/api/goals', { headers });
	};

	const createGoal = async (
		goalData: Partial<Goal>,
		habitIds: string[]
	): Promise<GoalWithProgress> => {
		const payload = {
			title: goalData.title,
			description: goalData.description ?? null,
			startDate:
				goalData.startDate instanceof Date
					? goalData.startDate.toISOString().split('T')[0]
					: goalData.startDate,
			endDate:
				goalData.endDate instanceof Date
					? goalData.endDate.toISOString().split('T')[0]
					: goalData.endDate,
			habitIds
		};

		const res = await fetcher('/api/goals', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to create goal');
		}

		return (await res.json()) as GoalWithProgress;
	};

	const updateGoal = async (
		goalId: string,
		goalData: Partial<Goal>,
		habitIds: string[]
	): Promise<GoalWithProgress> => {
		const payload = {
			title: goalData.title,
			description: goalData.description ?? null,
			startDate:
				goalData.startDate instanceof Date
					? goalData.startDate.toISOString().split('T')[0]
					: goalData.startDate,
			endDate:
				goalData.endDate instanceof Date
					? goalData.endDate.toISOString().split('T')[0]
					: goalData.endDate,
			habitIds
		};

		const res = await fetcher(`/api/goals/${goalId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to update goal');
		}

		return (await res.json()) as GoalWithProgress;
	};

	const deleteGoal = async (goalId: string): Promise<void> => {
		const res = await fetcher(`/api/goals/${goalId}`, { method: 'DELETE' });

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to delete goal');
		}
	};

	const fetchQuote = async (signal?: AbortSignal): Promise<{ quote: string; author: string }> => {
		const res = await fetcher('/api-external/quotes', { signal });

		if (!res.ok) {
			throw new Error('Quote fetch failed');
		}

		return (await res.json()) as { quote: string; author: string };
	};

	return {
		// Habits
		fetchHabits,
		createHabit,
		updateHabit,
		deleteHabit,
		// Goals
		fetchGoals,
		createGoal,
		updateGoal,
		deleteGoal,
		// Quotes
		fetchQuote
	};
}

export type HabitsApi = ReturnType<typeof createHabitsApi>;
