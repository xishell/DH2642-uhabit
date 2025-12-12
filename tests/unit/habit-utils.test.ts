import { describe, it, expect } from 'vitest';
import {
	shouldShowHabitOnDate,
	filterHabitsForDate,
	isCompletionOnDate,
	getCompletionsForHabitOnDate,
	getHabitsForDate,
	getCompletionStats,
	groupHabitsByStatus
} from '$lib/utils/habit';
import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';

// Test data factories
function createHabit(overrides: Partial<Habit> = {}): Habit {
	return {
		id: 'habit-1',
		userId: 'user-1',
		title: 'Test Habit',
		notes: null,
		color: null,
		frequency: 'daily',
		measurement: 'boolean',
		period: null,
		targetAmount: null,
		unit: null,
		categoryId: null,
		goalId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

function createCompletion(overrides: Partial<HabitCompletion> = {}): HabitCompletion {
	return {
		id: 'completion-1',
		habitId: 'habit-1',
		userId: 'user-1',
		completedAt: new Date(),
		measurement: null,
		notes: null,
		createdAt: new Date(),
		...overrides
	};
}

describe('Habit Utilities', () => {
	describe('shouldShowHabitOnDate', () => {
		describe('daily frequency', () => {
			it('always returns true for daily habits', () => {
				const habit = createHabit({ frequency: 'daily' });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-01'))).toBe(true);
				expect(shouldShowHabitOnDate(habit, new Date('2025-06-15'))).toBe(true);
				expect(shouldShowHabitOnDate(habit, new Date('2025-12-31'))).toBe(true);
			});
		});

		describe('weekly frequency', () => {
			it('returns true for matching day of week', () => {
				const habit = createHabit({ frequency: 'weekly', period: [1, 3, 5] }); // Mon, Wed, Fri
				const monday = new Date('2025-01-06'); // This is a Monday

				expect(shouldShowHabitOnDate(habit, monday)).toBe(true);
			});

			it('returns false for non-matching day of week', () => {
				const habit = createHabit({ frequency: 'weekly', period: [1, 3, 5] }); // Mon, Wed, Fri
				const tuesday = new Date('2025-01-07'); // This is a Tuesday

				expect(shouldShowHabitOnDate(habit, tuesday)).toBe(false);
			});

			it('handles Sunday (day 0) correctly', () => {
				const habit = createHabit({ frequency: 'weekly', period: [0] }); // Sunday only
				const sunday = new Date('2025-01-05'); // This is a Sunday

				expect(shouldShowHabitOnDate(habit, sunday)).toBe(true);
			});

			it('treats empty period as daily', () => {
				const habit = createHabit({ frequency: 'weekly', period: [] });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-06'))).toBe(true);
			});

			it('treats null period as daily', () => {
				const habit = createHabit({ frequency: 'weekly', period: null });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-06'))).toBe(true);
			});
		});

		describe('monthly frequency', () => {
			it('returns true for matching day of month', () => {
				const habit = createHabit({ frequency: 'monthly', period: [1, 15] });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-01'))).toBe(true);
				expect(shouldShowHabitOnDate(habit, new Date('2025-01-15'))).toBe(true);
			});

			it('returns false for non-matching day of month', () => {
				const habit = createHabit({ frequency: 'monthly', period: [1, 15] });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-10'))).toBe(false);
			});

			it('handles end of month correctly', () => {
				const habit = createHabit({ frequency: 'monthly', period: [31] });

				expect(shouldShowHabitOnDate(habit, new Date('2025-01-31'))).toBe(true);
				expect(shouldShowHabitOnDate(habit, new Date('2025-02-28'))).toBe(false); // Feb doesn't have 31
			});
		});
	});

	describe('filterHabitsForDate', () => {
		it('filters multiple habits by date', () => {
			const habits = [
				createHabit({ id: 'h1', frequency: 'daily' }),
				createHabit({ id: 'h2', frequency: 'weekly', period: [1] }), // Monday only
				createHabit({ id: 'h3', frequency: 'weekly', period: [2] }) // Tuesday only
			];
			const monday = new Date('2025-01-06');

			const result = filterHabitsForDate(habits, monday);

			expect(result).toHaveLength(2);
			expect(result.map((h) => h.id)).toContain('h1');
			expect(result.map((h) => h.id)).toContain('h2');
		});
	});

	describe('isCompletionOnDate', () => {
		it('returns true for completion on same date', () => {
			const completion = createCompletion({ completedAt: new Date('2025-01-15T14:30:00') });

			expect(isCompletionOnDate(completion, new Date('2025-01-15'))).toBe(true);
		});

		it('returns true regardless of time on same date', () => {
			const completion = createCompletion({ completedAt: new Date('2025-01-15T23:59:59') });

			expect(isCompletionOnDate(completion, new Date('2025-01-15T00:00:00'))).toBe(true);
		});

		it('returns false for completion on different date', () => {
			const completion = createCompletion({ completedAt: new Date('2025-01-15T14:30:00') });

			expect(isCompletionOnDate(completion, new Date('2025-01-16'))).toBe(false);
		});
	});

	describe('getCompletionsForHabitOnDate', () => {
		it('returns completions for specific habit on specific date', () => {
			const completions = [
				createCompletion({ id: 'c1', habitId: 'h1', completedAt: new Date('2025-01-15T10:00:00') }),
				createCompletion({ id: 'c2', habitId: 'h1', completedAt: new Date('2025-01-15T14:00:00') }),
				createCompletion({ id: 'c3', habitId: 'h1', completedAt: new Date('2025-01-16T10:00:00') }),
				createCompletion({ id: 'c4', habitId: 'h2', completedAt: new Date('2025-01-15T10:00:00') })
			];

			const result = getCompletionsForHabitOnDate('h1', completions, new Date('2025-01-15'));

			expect(result).toHaveLength(2);
			expect(result.map((c) => c.id)).toEqual(['c1', 'c2']);
		});

		it('returns empty array when no matching completions', () => {
			const completions = [
				createCompletion({ habitId: 'h1', completedAt: new Date('2025-01-16T10:00:00') })
			];

			const result = getCompletionsForHabitOnDate('h1', completions, new Date('2025-01-15'));

			expect(result).toHaveLength(0);
		});
	});

	describe('getHabitsForDate', () => {
		it('returns habits with completion status for boolean habits', () => {
			const habits = [createHabit({ id: 'h1', measurement: 'boolean' })];
			const completions = [
				createCompletion({ habitId: 'h1', completedAt: new Date('2025-01-15T12:00:00') })
			];

			const result = getHabitsForDate(habits, completions, new Date('2025-01-15'));

			expect(result).toHaveLength(1);
			expect(result[0].isCompleted).toBe(true);
			expect(result[0].progress).toBe(1);
			expect(result[0].target).toBeNull();
		});

		it('calculates progress for numeric habits', () => {
			const habits = [createHabit({ id: 'h1', measurement: 'numeric', targetAmount: 10 })];
			const completions = [
				createCompletion({
					habitId: 'h1',
					completedAt: new Date('2025-01-15T10:00:00'),
					measurement: 3
				}),
				createCompletion({
					habitId: 'h1',
					completedAt: new Date('2025-01-15T14:00:00'),
					measurement: 5
				})
			];

			const result = getHabitsForDate(habits, completions, new Date('2025-01-15'));

			expect(result[0].progress).toBe(8); // 3 + 5
			expect(result[0].target).toBe(10);
			expect(result[0].isCompleted).toBe(false);
		});

		it('marks numeric habit as completed when target reached', () => {
			const habits = [createHabit({ id: 'h1', measurement: 'numeric', targetAmount: 10 })];
			const completions = [
				createCompletion({
					habitId: 'h1',
					completedAt: new Date('2025-01-15T12:00:00'),
					measurement: 10
				})
			];

			const result = getHabitsForDate(habits, completions, new Date('2025-01-15'));

			expect(result[0].isCompleted).toBe(true);
		});

		it('filters out habits not scheduled for the date', () => {
			const habits = [
				createHabit({ id: 'h1', frequency: 'weekly', period: [1] }), // Monday only
				createHabit({ id: 'h2', frequency: 'daily' })
			];
			const tuesday = new Date('2025-01-07'); // Tuesday

			const result = getHabitsForDate(habits, [], tuesday);

			expect(result).toHaveLength(1);
			expect(result[0].habit.id).toBe('h2');
		});
	});

	describe('getCompletionStats', () => {
		it('calculates completion statistics', () => {
			const habitsWithStatus: HabitWithStatus[] = [
				{
					habit: createHabit({ id: 'h1' }),
					isCompleted: true,
					completion: null,
					progress: 1,
					target: null
				},
				{
					habit: createHabit({ id: 'h2' }),
					isCompleted: true,
					completion: null,
					progress: 1,
					target: null
				},
				{
					habit: createHabit({ id: 'h3' }),
					isCompleted: false,
					completion: null,
					progress: 0,
					target: null
				}
			];

			const result = getCompletionStats(habitsWithStatus);

			expect(result.completed).toBe(2);
			expect(result.total).toBe(3);
			expect(result.percentage).toBe(67); // Math.round(2/3 * 100)
		});

		it('returns 0 percentage for empty array', () => {
			const result = getCompletionStats([]);

			expect(result.completed).toBe(0);
			expect(result.total).toBe(0);
			expect(result.percentage).toBe(0);
		});
	});

	describe('groupHabitsByStatus', () => {
		it('groups habits by completion status', () => {
			const habitsWithStatus: HabitWithStatus[] = [
				{
					habit: createHabit({ id: 'h1' }),
					isCompleted: true,
					completion: null,
					progress: 1,
					target: null
				},
				{
					habit: createHabit({ id: 'h2' }),
					isCompleted: false,
					completion: null,
					progress: 0,
					target: null
				},
				{
					habit: createHabit({ id: 'h3' }),
					isCompleted: true,
					completion: null,
					progress: 1,
					target: null
				}
			];

			const result = groupHabitsByStatus(habitsWithStatus);

			expect(result.completed).toHaveLength(2);
			expect(result.pending).toHaveLength(1);
			expect(result.completed.map((h) => h.habit.id)).toEqual(['h1', 'h3']);
			expect(result.pending.map((h) => h.habit.id)).toEqual(['h2']);
		});
	});
});
