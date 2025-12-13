/**
 * Heatmap computation for habit visualization
 * Generates cell data for different time scopes
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { DateRange, Scope, HeatCell } from './types';
import { computeCompletionRate } from './computeCompletionRate';
import { formatDate, startOfDay, endOfDay } from '$lib/utils/date';

/**
 * Get ISO week number for a date
 */
function getISOWeek(date: Date): number {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 4 - (d.getDay() || 7));
	const yearStart = new Date(d.getFullYear(), 0, 1);
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format a date key based on scope
 */
function formatDateKey(date: Date, scope: Scope): string {
	if (scope === 'daily') {
		return formatDate(date);
	} else if (scope === 'weekly') {
		const week = getISOWeek(date);
		return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
	} else {
		// Monthly
		return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
	}
}

/**
 * Get the start of a week (Monday)
 */
function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
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
 * Get the start of a month
 */
function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of a month
 */
function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Compute heatmap data for a date range and scope
 *
 * @param habits - Habits to include
 * @param completions - All completions
 * @param range - Date range for the heatmap
 * @param scope - Time granularity (daily, weekly, monthly)
 */
export function computeHeatmap(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange,
	scope: Scope
): HeatCell[] {
	const cells: HeatCell[] = [];

	if (scope === 'daily') {
		// One cell per day
		const current = startOfDay(range.from);
		const end = startOfDay(range.to);

		while (current <= end) {
			const dayRange = { from: new Date(current), to: endOfDay(current) };
			const result = computeCompletionRate(habits, completions, dayRange);

			cells.push({
				date: formatDateKey(current, scope),
				value: result.rate,
				completions: result.completed,
				total: result.total
			});

			current.setDate(current.getDate() + 1);
		}
	} else if (scope === 'weekly') {
		// One cell per week
		let current = startOfWeek(range.from);
		const end = endOfWeek(range.to);

		while (current <= end) {
			const weekEnd = endOfWeek(current);
			const weekRange = { from: new Date(current), to: weekEnd };
			const result = computeCompletionRate(habits, completions, weekRange);

			cells.push({
				date: formatDateKey(current, scope),
				value: result.rate,
				completions: result.completed,
				total: result.total
			});

			current.setDate(current.getDate() + 7);
		}
	} else {
		// Monthly: one cell per month
		let current = startOfMonth(range.from);
		const end = endOfMonth(range.to);

		while (current <= end) {
			const monthEnd = endOfMonth(current);
			const monthRange = { from: new Date(current), to: monthEnd };
			const result = computeCompletionRate(habits, completions, monthRange);

			cells.push({
				date: formatDateKey(current, scope),
				value: result.rate,
				completions: result.completed,
				total: result.total
			});

			// Move to next month
			current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
		}
	}

	return cells;
}

/**
 * Get default date ranges for heatmap based on scope
 *
 * @param scope - Time granularity
 * @param asOfDate - Reference date (defaults to today)
 */
export function getHeatmapRange(scope: Scope, asOfDate: Date = new Date()): DateRange {
	const today = startOfDay(asOfDate);

	if (scope === 'daily') {
		// Last 35 days (5 weeks)
		const from = new Date(today);
		from.setDate(from.getDate() - 34);
		return { from, to: today };
	} else if (scope === 'weekly') {
		// Last 16 weeks
		const from = startOfWeek(today);
		from.setDate(from.getDate() - 15 * 7);
		return { from, to: endOfWeek(today) };
	} else {
		// Last 12 months
		const from = new Date(today.getFullYear() - 1, today.getMonth(), 1);
		return { from, to: endOfMonth(today) };
	}
}
