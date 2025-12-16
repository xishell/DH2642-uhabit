/**
 * API service layer for statistics.
 * Handles all HTTP communication for habits, completions, and stats cache.
 * This is the "Model" layer in MVP architecture.
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { Scope, ComputedStatistics } from '$lib/stats/types';
import { formatDate } from '$lib/utils/date';

export type Fetcher = typeof fetch;

export interface StatsApiDeps {
	fetcher: Fetcher;
}

export interface ServerCacheEntry {
	scope: Scope;
	dateKey: string;
	data: ComputedStatistics;
	computedAt: string;
	validUntil: string;
}

export function createStatsApi({ fetcher }: StatsApiDeps) {
	const fetchHabits = async (): Promise<Habit[]> => {
		const res = await fetcher('/api/habits');
		if (!res.ok) {
			throw new Error('Failed to fetch habits');
		}
		return res.json();
	};

	const fetchCompletions = async (from: Date): Promise<HabitCompletion[]> => {
		const params = new URLSearchParams({ from: formatDate(from) });
		const res = await fetcher(`/api/completions?${params}`);
		if (!res.ok) {
			throw new Error('Failed to fetch completions');
		}
		return res.json();
	};

	const getServerCache = async (
		scope: Scope,
		dateKey: string
	): Promise<ServerCacheEntry | null> => {
		const params = new URLSearchParams({ scope, dateKey });
		const res = await fetcher(`/api/stats/cache?${params}`);
		if (!res.ok) {
			return null;
		}
		return res.json();
	};

	const setServerCache = async (
		scope: Scope,
		dateKey: string,
		data: ComputedStatistics,
		validUntil: Date
	): Promise<void> => {
		await fetcher('/api/stats/cache', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				scope,
				dateKey,
				data,
				validUntil: validUntil.toISOString()
			})
		});
	};

	const clearServerCache = async (): Promise<void> => {
		await fetcher('/api/stats/cache', { method: 'DELETE' });
	};

	return {
		fetchHabits,
		fetchCompletions,
		getServerCache,
		setServerCache,
		clearServerCache
	};
}

export type StatsApi = ReturnType<typeof createStatsApi>;
