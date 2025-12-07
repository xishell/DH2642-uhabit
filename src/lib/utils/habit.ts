/**
 * Habit utility functions for filtering and status tracking
 */

import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';
import { startOfDay, endOfDay } from './date';

/**
 * Check if a habit should be shown on a specific date based on its frequency and period
 *
 * @param habit - The habit to check
 * @param date - The date to check against (defaults to today)
 * @returns true if the habit should be shown on the given date
 *
 * @example
 * // Daily habit - always shows
 * shouldShowHabitOnDate({ frequency: 'daily', period: null }, new Date()) // true
 *
 * @example
 * // Weekly habit on Mon/Wed/Fri (1, 3, 5)
 * const monday = new Date('2025-12-08') // Monday
 * shouldShowHabitOnDate({ frequency: 'weekly', period: [1, 3, 5] }, monday) // true
 *
 * @example
 * // Monthly habit on 1st and 15th
 * const first = new Date('2025-12-01')
 * shouldShowHabitOnDate({ frequency: 'monthly', period: [1, 15] }, first) // true
 */
export function shouldShowHabitOnDate(habit: Habit, date: Date = new Date()): boolean {
	// Daily habits always show
	if (habit.frequency === 'daily') {
		return true;
	}

	// If no period specified, treat as daily (show every day)
	if (!habit.period || habit.period.length === 0) {
		return true;
	}

	if (habit.frequency === 'weekly') {
		// period contains days of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
		const dayOfWeek = date.getDay();
		return habit.period.includes(dayOfWeek);
	}

	if (habit.frequency === 'monthly') {
		// period contains days of month: 1-31
		const dayOfMonth = date.getDate();
		return habit.period.includes(dayOfMonth);
	}

	return true;
}

/**
 * Filter habits to only those that should be shown on a specific date
 *
 * @param habits - Array of habits to filter
 * @param date - The date to filter for (defaults to today)
 * @returns Habits that should be shown on the given date
 */
export function filterHabitsForDate(habits: Habit[], date: Date = new Date()): Habit[] {
	return habits.filter((habit) => shouldShowHabitOnDate(habit, date));
}

/**
 * Check if a completion falls on a specific date
 *
 * @param completion - The completion to check
 * @param date - The date to check against
 * @returns true if the completion is on the given date
 */
export function isCompletionOnDate(completion: HabitCompletion, date: Date): boolean {
	const completionDate = new Date(completion.completedAt);
	const dayStart = startOfDay(date);
	const dayEnd = endOfDay(date);

	return completionDate >= dayStart && completionDate <= dayEnd;
}

/**
 * Find completions for a specific habit on a specific date
 *
 * @param habitId - The habit ID to find completions for
 * @param completions - Array of completions to search
 * @param date - The date to check against
 * @returns Array of completions for the habit on the given date
 */
export function getCompletionsForHabitOnDate(
	habitId: string,
	completions: HabitCompletion[],
	date: Date
): HabitCompletion[] {
	return completions.filter(
		(completion) => completion.habitId === habitId && isCompletionOnDate(completion, date)
	);
}

/**
 * Get habits for a specific date with their completion status
 *
 * @param habits - Array of all habits
 * @param completions - Array of completions (should be filtered to relevant date range)
 * @param date - The date to check (defaults to today)
 * @returns Array of habits with their completion status for the given date
 *
 * @example
 * const habits = await fetch('/api/habits').then(r => r.json());
 * const completions = await fetch('/api/completions?date=2025-12-07').then(r => r.json());
 * const habitsWithStatus = getHabitsForDate(habits, completions);
 *
 * // Returns:
 * // [
 * //   { habit: {...}, isCompleted: true, completion: {...}, progress: 1, target: null },
 * //   { habit: {...}, isCompleted: false, completion: null, progress: 0, target: 8 },
 * // ]
 */
export function getHabitsForDate(
	habits: Habit[],
	completions: HabitCompletion[],
	date: Date = new Date()
): HabitWithStatus[] {
	// Filter habits that should be shown on this date
	const habitsForDate = filterHabitsForDate(habits, date);

	return habitsForDate.map((habit) => {
		const habitCompletions = getCompletionsForHabitOnDate(habit.id, completions, date);

		if (habit.measurement === 'boolean') {
			// Boolean habits: completed if any completion exists
			const isCompleted = habitCompletions.length > 0;
			return {
				habit,
				isCompleted,
				completion: habitCompletions[0] ?? null,
				progress: isCompleted ? 1 : 0,
				target: null
			};
		} else {
			// Numeric habits: sum up all measurements for the day
			const totalProgress = habitCompletions.reduce(
				(sum, completion) => sum + (completion.measurement ?? 0),
				0
			);
			const target = habit.targetAmount ?? 0;
			const isCompleted = target > 0 && totalProgress >= target;

			return {
				habit,
				isCompleted,
				// Return the most recent completion for display purposes
				completion: habitCompletions[0] ?? null,
				progress: totalProgress,
				target: habit.targetAmount
			};
		}
	});
}

/**
 * Calculate completion statistics for a set of habits
 *
 * @param habitsWithStatus - Array of habits with their completion status
 * @returns Statistics object with completed count, total count, and percentage
 */
export function getCompletionStats(habitsWithStatus: HabitWithStatus[]): {
	completed: number;
	total: number;
	percentage: number;
} {
	const completed = habitsWithStatus.filter((h) => h.isCompleted).length;
	const total = habitsWithStatus.length;
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

	return { completed, total, percentage };
}

/**
 * Group habits by completion status
 *
 * @param habitsWithStatus - Array of habits with their completion status
 * @returns Object with completed and pending habit arrays
 */
export function groupHabitsByStatus(habitsWithStatus: HabitWithStatus[]): {
	completed: HabitWithStatus[];
	pending: HabitWithStatus[];
} {
	return {
		completed: habitsWithStatus.filter((h) => h.isCompleted),
		pending: habitsWithStatus.filter((h) => !h.isCompleted)
	};
}
