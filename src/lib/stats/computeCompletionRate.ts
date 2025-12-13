/**
 * Completion rate computation for habits
 * Calculates completion percentages for date ranges
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { DateRange, CompletionRateResult } from './types';
import { shouldShowHabitOnDate } from '$lib/utils/habit';
import { formatDate, startOfDay } from '$lib/utils/date';

/**
 * Compute completion rate for a date range
 * Handles both boolean and numeric habits correctly
 *
 * @param habits - Habits to compute rate for
 * @param completions - All completions in the date range
 * @param range - Date range to compute rate for
 */
export function computeCompletionRate(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): CompletionRateResult {
	// Index completions by date and habit for O(1) lookup
	const completionsByDateAndHabit = new Map<string, Map<string, HabitCompletion[]>>();

	for (const completion of completions) {
		const dateKey = formatDate(new Date(completion.completedAt));
		if (!completionsByDateAndHabit.has(dateKey)) {
			completionsByDateAndHabit.set(dateKey, new Map());
		}
		const dateMap = completionsByDateAndHabit.get(dateKey)!;
		if (!dateMap.has(completion.habitId)) {
			dateMap.set(completion.habitId, []);
		}
		dateMap.get(completion.habitId)!.push(completion);
	}

	let totalScheduled = 0;
	let totalCompleted = 0;
	const byHabit = new Map<string, { rate: number; completed: number; total: number }>();

	// Initialize per-habit counters
	for (const habit of habits) {
		byHabit.set(habit.id, { rate: 0, completed: 0, total: 0 });
	}

	// Iterate through each day in range
	const current = startOfDay(range.from);
	const end = startOfDay(range.to);

	while (current <= end) {
		const dateKey = formatDate(current);
		const dayCompletions = completionsByDateAndHabit.get(dateKey) || new Map();

		for (const habit of habits) {
			if (shouldShowHabitOnDate(habit, current)) {
				const habitStats = byHabit.get(habit.id)!;
				habitStats.total++;
				totalScheduled++;

				const habitCompletions = dayCompletions.get(habit.id) || [];

				if (habit.measurement === 'boolean') {
					// Boolean: completed if any completion exists for that day
					if (habitCompletions.length > 0) {
						habitStats.completed++;
						totalCompleted++;
					}
				} else {
					// Numeric: sum measurements and compare to target
					const sum = habitCompletions.reduce((acc, c) => acc + (c.measurement ?? 0), 0);
					const target = habit.targetAmount ?? 0;
					if (target > 0 && sum >= target) {
						habitStats.completed++;
						totalCompleted++;
					}
				}
			}
		}

		current.setDate(current.getDate() + 1);
	}

	// Calculate rates
	for (const [, stats] of byHabit) {
		stats.rate = stats.total > 0 ? stats.completed / stats.total : 0;
	}

	return {
		rate: totalScheduled > 0 ? totalCompleted / totalScheduled : 0,
		completed: totalCompleted,
		total: totalScheduled,
		byHabit
	};
}

/**
 * Compute daily completion rates for a date range
 * Returns an array of rates, one per day
 *
 * @param habits - Habits to compute rates for
 * @param completions - All completions
 * @param range - Date range
 * @returns Array of daily completion rates (0-1)
 */
export function computeDailyRates(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): number[] {
	const rates: number[] = [];
	const current = startOfDay(range.from);
	const end = startOfDay(range.to);

	while (current <= end) {
		const dayRange = { from: current, to: new Date(current) };
		const result = computeCompletionRate(habits, completions, dayRange);
		rates.push(result.rate);
		current.setDate(current.getDate() + 1);
	}

	return rates;
}

/**
 * Find the best day of the week for completions
 *
 * @param habits - Habits to analyze
 * @param completions - All completions
 * @param range - Date range to analyze
 * @returns Day name with highest average completion rate
 */
export function findBestDayOfWeek(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): string {
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const dayStats = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));

	// Index completions
	const completionDates = new Set(completions.map((c) => formatDate(new Date(c.completedAt))));

	const current = startOfDay(range.from);
	const end = startOfDay(range.to);

	while (current <= end) {
		const dayOfWeek = current.getDay();
		const dateKey = formatDate(current);

		for (const habit of habits) {
			if (shouldShowHabitOnDate(habit, current)) {
				dayStats[dayOfWeek].total++;

				// Simple check: any completion on this date counts
				const habitCompletions = completions.filter(
					(c) => c.habitId === habit.id && formatDate(new Date(c.completedAt)) === dateKey
				);

				if (habitCompletions.length > 0) {
					dayStats[dayOfWeek].completed++;
				}
			}
		}

		current.setDate(current.getDate() + 1);
	}

	// Find best day
	let bestDay = 0;
	let bestRate = 0;

	for (let i = 0; i < 7; i++) {
		const rate = dayStats[i].total > 0 ? dayStats[i].completed / dayStats[i].total : 0;
		if (rate > bestRate) {
			bestRate = rate;
			bestDay = i;
		}
	}

	return dayNames[bestDay];
}

/**
 * Find the best date in a range (highest completion rate)
 *
 * @param habits - Habits to analyze
 * @param completions - All completions
 * @param range - Date range to search
 * @returns Formatted date string of the best day
 */
export function findBestDate(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): string {
	let bestDate = range.from;
	let bestRate = 0;

	const current = startOfDay(range.from);
	const end = startOfDay(range.to);

	while (current <= end) {
		const dayRange = { from: current, to: new Date(current) };
		const result = computeCompletionRate(habits, completions, dayRange);

		if (result.rate > bestRate) {
			bestRate = result.rate;
			bestDate = new Date(current);
		}

		current.setDate(current.getDate() + 1);
	}

	// Format as readable date
	return bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
