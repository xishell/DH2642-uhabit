/**
 * Streak computation for habits
 * Calculates current and longest streaks based on completion history
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { StreakResult } from './types';
import { shouldShowHabitOnDate } from '$lib/utils/habit';
import { formatDate, startOfDay } from '$lib/utils/date';

/**
 * Compute streak for a single habit
 * A streak is consecutive scheduled days with completions
 *
 * @param habit - The habit to compute streak for
 * @param completions - All completions (will be filtered to this habit)
 * @param asOfDate - Calculate streak as of this date (defaults to today)
 */
export function computeHabitStreak(
	habit: Habit,
	completions: HabitCompletion[],
	asOfDate: Date = new Date()
): StreakResult {
	// Filter completions for this habit
	const habitCompletions = completions.filter((c) => c.habitId === habit.id);

	if (habitCompletions.length === 0) {
		return { currentStreak: 0, longestStreak: 0, streakStartDate: null };
	}

	// Build set of completion dates for O(1) lookup
	const completionDates = new Set(
		habitCompletions.map((c) => formatDate(new Date(c.completedAt)))
	);

	const today = startOfDay(asOfDate);
	let currentStreak = 0;
	let longestStreak = 0;
	let tempStreak = 0;
	let streakStartDate: Date | null = null;
	let tempStreakStart: Date | null = null;
	let isCurrentStreakActive = true;

	// Walk backwards from today, up to 365 days
	const checkDate = new Date(today);

	for (let i = 0; i < 365; i++) {
		const dateStr = formatDate(checkDate);
		const isScheduled = shouldShowHabitOnDate(habit, checkDate);

		if (isScheduled) {
			const hasCompletion = completionDates.has(dateStr);

			if (hasCompletion) {
				tempStreak++;
				if (!tempStreakStart) {
					tempStreakStart = new Date(checkDate);
				}
			} else {
				// Missed a scheduled day - streak broken
				if (tempStreak > longestStreak) {
					longestStreak = tempStreak;
				}
				if (isCurrentStreakActive && tempStreak > 0) {
					currentStreak = tempStreak;
					streakStartDate = tempStreakStart;
					isCurrentStreakActive = false;
				}
				tempStreak = 0;
				tempStreakStart = null;
			}
		}

		checkDate.setDate(checkDate.getDate() - 1);
	}

	// Handle streak that extends to the beginning of our search window
	if (tempStreak > longestStreak) {
		longestStreak = tempStreak;
	}
	if (isCurrentStreakActive && tempStreak > 0) {
		currentStreak = tempStreak;
		streakStartDate = tempStreakStart;
	}

	return { currentStreak, longestStreak, streakStartDate };
}

/**
 * Compute overall streak across all habits
 * A day counts as completed if the user completed ANY scheduled habit that day
 *
 * @param habits - All habits to consider
 * @param completions - All completions
 * @param asOfDate - Calculate streak as of this date
 */
export function computeOverallStreak(
	habits: Habit[],
	completions: HabitCompletion[],
	asOfDate: Date = new Date()
): StreakResult {
	if (habits.length === 0 || completions.length === 0) {
		return { currentStreak: 0, longestStreak: 0, streakStartDate: null };
	}

	// Build map of date -> set of completed habit IDs
	const completionsByDate = new Map<string, Set<string>>();
	for (const completion of completions) {
		const dateStr = formatDate(new Date(completion.completedAt));
		if (!completionsByDate.has(dateStr)) {
			completionsByDate.set(dateStr, new Set());
		}
		completionsByDate.get(dateStr)!.add(completion.habitId);
	}

	const today = startOfDay(asOfDate);
	let currentStreak = 0;
	let longestStreak = 0;
	let tempStreak = 0;
	let streakStartDate: Date | null = null;
	let tempStreakStart: Date | null = null;
	let isCurrentStreakActive = true;

	const checkDate = new Date(today);

	for (let i = 0; i < 365; i++) {
		const dateStr = formatDate(checkDate);

		// Find habits scheduled for this day
		const scheduledHabits = habits.filter((h) => shouldShowHabitOnDate(h, checkDate));

		if (scheduledHabits.length > 0) {
			const completedIds = completionsByDate.get(dateStr) || new Set();

			// Check if at least one scheduled habit was completed
			const hasAnyCompletion = scheduledHabits.some((h) => completedIds.has(h.id));

			if (hasAnyCompletion) {
				tempStreak++;
				if (!tempStreakStart) {
					tempStreakStart = new Date(checkDate);
				}
			} else {
				// No completions on a day with scheduled habits
				if (tempStreak > longestStreak) {
					longestStreak = tempStreak;
				}
				if (isCurrentStreakActive && tempStreak > 0) {
					currentStreak = tempStreak;
					streakStartDate = tempStreakStart;
					isCurrentStreakActive = false;
				}
				tempStreak = 0;
				tempStreakStart = null;
			}
		}
		// Days with no scheduled habits don't break streaks

		checkDate.setDate(checkDate.getDate() - 1);
	}

	// Handle streak at the end of search window
	if (tempStreak > longestStreak) {
		longestStreak = tempStreak;
	}
	if (isCurrentStreakActive && tempStreak > 0) {
		currentStreak = tempStreak;
		streakStartDate = tempStreakStart;
	}

	return { currentStreak, longestStreak, streakStartDate };
}

/**
 * Compute streaks for all habits at once
 * More efficient than calling computeHabitStreak for each habit
 *
 * @param habits - All habits
 * @param completions - All completions
 * @param asOfDate - Calculate streaks as of this date
 * @returns Map of habitId -> StreakResult
 */
export function computeAllHabitStreaks(
	habits: Habit[],
	completions: HabitCompletion[],
	asOfDate: Date = new Date()
): Map<string, StreakResult> {
	const results = new Map<string, StreakResult>();

	// Pre-index completions by habit for efficiency
	const completionsByHabit = new Map<string, HabitCompletion[]>();
	for (const completion of completions) {
		if (!completionsByHabit.has(completion.habitId)) {
			completionsByHabit.set(completion.habitId, []);
		}
		completionsByHabit.get(completion.habitId)!.push(completion);
	}

	for (const habit of habits) {
		const habitCompletions = completionsByHabit.get(habit.id) || [];
		results.set(habit.id, computeHabitStreak(habit, habitCompletions, asOfDate));
	}

	return results;
}
