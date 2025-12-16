/**
 * Test utilities for statistics computation
 * Provides mock data generators for various testing scenarios
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';

let idCounter = 0;

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return `test-${++idCounter}`;
}

/**
 * Reset ID counter (call in beforeEach)
 */
export function resetIds(): void {
	idCounter = 0;
}

/**
 * Create a mock habit
 */
export function createHabit(overrides: Partial<Habit> = {}): Habit {
	const id = generateId();
	return {
		id,
		userId: 'test-user',
		title: `Habit ${id}`,
		notes: null,
		color: null,
		frequency: 'daily',
		measurement: 'boolean',
		period: null,
		targetAmount: null,
		unit: null,
		categoryId: null,
		goalId: null,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		...overrides
	};
}

/**
 * Create a mock completion
 */
export function createCompletion(
	habitId: string,
	completedAt: Date,
	overrides: Partial<HabitCompletion> = {}
): HabitCompletion {
	const id = generateId();
	return {
		id,
		habitId,
		userId: 'test-user',
		completedAt,
		measurement: null,
		notes: null,
		createdAt: completedAt,
		...overrides
	};
}

/**
 * Create completions for a date range
 *
 * @param habitId - Habit ID
 * @param startDate - Start of range
 * @param days - Number of days
 * @param skipDays - Days to skip (0-indexed from start)
 */
export function createCompletionsForRange(
	habitId: string,
	startDate: Date,
	days: number,
	skipDays: number[] = []
): HabitCompletion[] {
	const completions: HabitCompletion[] = [];

	for (let i = 0; i < days; i++) {
		if (skipDays.includes(i)) continue;

		const date = new Date(startDate);
		date.setDate(date.getDate() + i);
		completions.push(createCompletion(habitId, date));
	}

	return completions;
}

/**
 * Create a perfect streak of completions
 */
export function createPerfectStreak(
	habitId: string,
	endDate: Date,
	streakLength: number
): HabitCompletion[] {
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - streakLength + 1);
	return createCompletionsForRange(habitId, startDate, streakLength);
}

/**
 * Create completions with a gap
 */
export function createStreakWithGap(
	habitId: string,
	endDate: Date,
	beforeGap: number,
	gapDays: number,
	afterGap: number
): HabitCompletion[] {
	const completions: HabitCompletion[] = [];

	// After gap (most recent)
	for (let i = 0; i < afterGap; i++) {
		const date = new Date(endDate);
		date.setDate(date.getDate() - i);
		completions.push(createCompletion(habitId, date));
	}

	// Before gap
	const gapEnd = new Date(endDate);
	gapEnd.setDate(gapEnd.getDate() - afterGap - gapDays);

	for (let i = 0; i < beforeGap; i++) {
		const date = new Date(gapEnd);
		date.setDate(date.getDate() - i);
		completions.push(createCompletion(habitId, date));
	}

	return completions;
}

/**
 * Create a weekly habit (specific days of week)
 */
export function createWeeklyHabit(daysOfWeek: number[], overrides: Partial<Habit> = {}): Habit {
	return createHabit({
		frequency: 'weekly',
		period: daysOfWeek,
		...overrides
	});
}

/**
 * Create a monthly habit (specific days of month)
 */
export function createMonthlyHabit(daysOfMonth: number[], overrides: Partial<Habit> = {}): Habit {
	return createHabit({
		frequency: 'monthly',
		period: daysOfMonth,
		...overrides
	});
}

/**
 * Create a numeric habit
 */
export function createNumericHabit(
	targetAmount: number,
	unit: string,
	overrides: Partial<Habit> = {}
): Habit {
	return createHabit({
		measurement: 'numeric',
		targetAmount,
		unit,
		...overrides
	});
}

/**
 * Create a numeric completion with measurement
 */
export function createNumericCompletion(
	habitId: string,
	completedAt: Date,
	measurement: number
): HabitCompletion {
	return createCompletion(habitId, completedAt, { measurement });
}

/**
 * Generate random completions for stress testing
 */
export function createRandomCompletions(
	habitId: string,
	startDate: Date,
	days: number,
	completionRate: number = 0.7
): HabitCompletion[] {
	const completions: HabitCompletion[] = [];

	for (let i = 0; i < days; i++) {
		if (Math.random() < completionRate) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			// Add random hour for time-of-day analysis
			date.setHours(Math.floor(Math.random() * 24));
			completions.push(createCompletion(habitId, date));
		}
	}

	return completions;
}

/**
 * Create a date range
 */
export function createDateRange(startDate: Date, days: number) {
	const from = new Date(startDate);
	const to = new Date(startDate);
	to.setDate(to.getDate() + days - 1);
	return { from, to };
}

/**
 * Get date N days ago from reference
 */
export function daysAgo(days: number, from: Date = new Date()): Date {
	const date = new Date(from);
	date.setDate(date.getDate() - days);
	date.setHours(12, 0, 0, 0); // Normalize to noon
	return date;
}

/**
 * Get today at noon (normalized)
 */
export function today(): Date {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	return date;
}
