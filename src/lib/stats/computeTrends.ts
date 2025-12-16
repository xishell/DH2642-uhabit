/**
 * Trend computation for habits
 * Calculates per-habit trends with deltas and sparklines
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { DateRange, Scope, HabitTrend } from './types';
import { computeCompletionRate } from './computeCompletionRate';
import { computeHabitStreak } from './computeStreaks';
import { startOfDay, endOfDay } from '$lib/utils/date';

/**
 * Get the start of a week (Monday)
 */
function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the end of a week (Sunday)
 */
function endOfWeek(date: Date): Date {
	const start = startOfWeek(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}

/**
 * Generate sparkline ranges for a given scope
 *
 * @param scope - Time granularity
 * @param asOfDate - Reference date
 * @param count - Number of periods to include
 */
export function getSparklineRanges(
	scope: Scope,
	asOfDate: Date = new Date(),
	count: number = 7
): DateRange[] {
	const ranges: DateRange[] = [];
	const today = startOfDay(asOfDate);

	if (scope === 'daily') {
		// Last N days
		for (let i = count - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			ranges.push({ from: date, to: endOfDay(date) });
		}
	} else if (scope === 'weekly') {
		// Last N weeks
		const currentWeekStart = startOfWeek(today);
		for (let i = count - 1; i >= 0; i--) {
			const weekStart = new Date(currentWeekStart);
			weekStart.setDate(weekStart.getDate() - i * 7);
			ranges.push({ from: weekStart, to: endOfWeek(weekStart) });
		}
	} else {
		// Last N months
		for (let i = count - 1; i >= 0; i--) {
			const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
			const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
			ranges.push({ from: monthStart, to: monthEnd });
		}
	}

	return ranges;
}

/**
 * Get current and previous period ranges based on scope
 *
 * @param scope - Time granularity
 * @param asOfDate - Reference date
 */
export function getPeriodRanges(
	scope: Scope,
	asOfDate: Date = new Date()
): { current: DateRange; previous: DateRange } {
	const today = startOfDay(asOfDate);

	if (scope === 'daily') {
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		return {
			current: { from: today, to: endOfDay(today) },
			previous: { from: yesterday, to: endOfDay(yesterday) }
		};
	} else if (scope === 'weekly') {
		const currentWeekStart = startOfWeek(today);
		const prevWeekStart = new Date(currentWeekStart);
		prevWeekStart.setDate(prevWeekStart.getDate() - 7);

		return {
			current: { from: currentWeekStart, to: endOfWeek(currentWeekStart) },
			previous: { from: prevWeekStart, to: endOfWeek(prevWeekStart) }
		};
	} else {
		// Monthly
		const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
		const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
		const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
		const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

		return {
			current: { from: currentMonthStart, to: currentMonthEnd },
			previous: { from: prevMonthStart, to: prevMonthEnd }
		};
	}
}

/**
 * Compute trends for all habits
 *
 * @param habits - All habits
 * @param completions - All completions
 * @param scope - Time granularity
 * @param asOfDate - Reference date
 */
export function computeTrends(
	habits: Habit[],
	completions: HabitCompletion[],
	scope: Scope,
	asOfDate: Date = new Date()
): HabitTrend[] {
	const { current: currentRange, previous: previousRange } = getPeriodRanges(scope, asOfDate);
	const sparklineRanges = getSparklineRanges(scope, asOfDate, 7);

	// Compute rates for current and previous periods
	const currentRate = computeCompletionRate(habits, completions, currentRange);
	const previousRate = computeCompletionRate(habits, completions, previousRange);

	// Build trends for each habit
	const trends: HabitTrend[] = habits.map((habit) => {
		const currentHabitRate = currentRate.byHabit.get(habit.id) || {
			rate: 0,
			completed: 0,
			total: 0
		};
		const previousHabitRate = previousRate.byHabit.get(habit.id) || {
			rate: 0,
			completed: 0,
			total: 0
		};

		// Compute streak
		const streak = computeHabitStreak(habit, completions, asOfDate);

		// Compute sparkline values
		const spark = sparklineRanges.map((range) => {
			const result = computeCompletionRate([habit], completions, range);
			return result.rate;
		});

		return {
			habitId: habit.id,
			title: habit.title,
			completion: currentHabitRate.rate,
			streak: streak.currentStreak,
			delta: currentHabitRate.rate - previousHabitRate.rate,
			spark
		};
	});

	// Sort by completion rate (highest first)
	return trends.sort((a, b) => b.completion - a.completion);
}

/**
 * Find the most consistent habit (highest completion rate)
 */
export function findMostConsistent(trends: HabitTrend[]): string | null {
	if (trends.length === 0) return null;
	// Already sorted by completion rate
	return trends[0].title;
}

/**
 * Find the habit that needs attention (lowest completion rate with activity)
 */
export function findNeedsAttention(trends: HabitTrend[]): string | null {
	if (trends.length === 0) return null;

	// Find habit with lowest non-zero completion rate, or lowest overall
	const withActivity = trends.filter((t) => t.completion > 0 && t.completion < 0.7);
	if (withActivity.length > 0) {
		return withActivity[withActivity.length - 1].title;
	}

	// Fall back to lowest completion
	return trends[trends.length - 1].title;
}
