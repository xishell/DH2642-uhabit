import { describe, it, expect } from 'vitest';
import {
	getDateRange,
	getScheduledDatesForHabit,
	completionUnitsForHabit,
	calculateGoalProgress,
	calculateGoalWithTodayStatus,
	isGoalActive,
	filterActiveGoals,
	sortGoalsByEndDate
} from '$lib/utils/goal';
import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { Goal } from '$lib/types/goal';

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

function createGoal(overrides: Partial<Goal> = {}): Goal {
	return {
		id: 'goal-1',
		userId: 'user-1',
		title: 'Test Goal',
		description: null,
		startDate: new Date('2025-01-01'),
		endDate: new Date('2025-01-31'),
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

describe('Goal Utilities', () => {
	describe('getDateRange', () => {
		it('returns array of dates between start and end (inclusive)', () => {
			const start = new Date('2025-01-01');
			const end = new Date('2025-01-03');
			const result = getDateRange(start, end);

			expect(result).toHaveLength(3);
			expect(result[0].getDate()).toBe(1);
			expect(result[2].getDate()).toBe(3);
		});

		it('returns single date when start equals end', () => {
			const date = new Date('2025-01-15');
			const result = getDateRange(date, date);

			expect(result).toHaveLength(1);
		});

		it('returns empty array when end is before start', () => {
			const start = new Date('2025-01-15');
			const end = new Date('2025-01-10');
			const result = getDateRange(start, end);

			expect(result).toHaveLength(0);
		});
	});

	describe('getScheduledDatesForHabit', () => {
		it('returns all dates for daily habit', () => {
			const habit = createHabit({ frequency: 'daily' });
			const result = getScheduledDatesForHabit(
				habit,
				new Date('2025-01-01'),
				new Date('2025-01-07')
			);

			expect(result).toHaveLength(7);
		});

		it('filters to specific weekdays for weekly habit', () => {
			const habit = createHabit({ frequency: 'weekly', period: [1, 3, 5] }); // Mon, Wed, Fri
			// Jan 6, 2025 is a Monday
			const result = getScheduledDatesForHabit(
				habit,
				new Date('2025-01-06'),
				new Date('2025-01-12')
			);

			expect(result).toHaveLength(3);
		});

		it('filters to specific days for monthly habit', () => {
			const habit = createHabit({ frequency: 'monthly', period: [1, 15] });
			const result = getScheduledDatesForHabit(
				habit,
				new Date('2025-01-01'),
				new Date('2025-01-31')
			);

			expect(result).toHaveLength(2);
		});
	});

	describe('completionUnitsForHabit', () => {
		it('counts boolean habit completions correctly', () => {
			const habit = createHabit({ measurement: 'boolean' });
			const completions = [
				createCompletion({ completedAt: new Date('2025-01-01T12:00:00') }),
				createCompletion({ completedAt: new Date('2025-01-02T12:00:00') })
			];

			const result = completionUnitsForHabit(
				habit,
				completions,
				new Date('2025-01-01'),
				new Date('2025-01-03')
			);

			expect(result).toBe(2); // 2 days completed out of 3
		});

		it('calculates numeric habit progress as fraction of target', () => {
			const habit = createHabit({ measurement: 'numeric', targetAmount: 10 });
			const completions = [
				createCompletion({ completedAt: new Date('2025-01-01T12:00:00'), measurement: 5 }),
				createCompletion({ completedAt: new Date('2025-01-02T12:00:00'), measurement: 10 })
			];

			const result = completionUnitsForHabit(
				habit,
				completions,
				new Date('2025-01-01'),
				new Date('2025-01-02')
			);

			expect(result).toBe(1.5); // 0.5 + 1.0 (capped at 1 per day)
		});

		it('caps numeric progress at 1 per day', () => {
			const habit = createHabit({ measurement: 'numeric', targetAmount: 10 });
			const completions = [
				createCompletion({ completedAt: new Date('2025-01-01T12:00:00'), measurement: 20 }) // Over target
			];

			const result = completionUnitsForHabit(
				habit,
				completions,
				new Date('2025-01-01'),
				new Date('2025-01-01')
			);

			expect(result).toBe(1); // Capped at 1
		});

		it('ignores completions on unscheduled days', () => {
			const habit = createHabit({ frequency: 'weekly', period: [1] }); // Mondays only
			const completions = [
				createCompletion({ completedAt: new Date('2025-01-02T12:00:00') }), // Thursday
				createCompletion({ completedAt: new Date('2025-01-07T12:00:00') }) // Tuesday
			];

			const result = completionUnitsForHabit(
				habit,
				completions,
				new Date('2025-01-01'),
				new Date('2025-01-07')
			);

			expect(result).toBe(0);
		});

		it('returns 0 units for numeric habits with non-positive target', () => {
			const habit = createHabit({ measurement: 'numeric', targetAmount: 0 });
			const completions = [
				createCompletion({ completedAt: new Date('2025-01-01T12:00:00'), measurement: 5 })
			];

			const result = completionUnitsForHabit(
				habit,
				completions,
				new Date('2025-01-01'),
				new Date('2025-01-01')
			);

			expect(result).toBe(0);
		});
	});

	describe('calculateGoalProgress', () => {
		it('calculates progress percentage correctly', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-10')
			});
			const habit = createHabit({ goalId: 'goal-1', frequency: 'daily' });
			const completions = Array.from({ length: 5 }, (_, i) =>
				createCompletion({ completedAt: new Date(`2025-01-0${i + 1}T12:00:00`) })
			);

			const result = calculateGoalProgress(goal, [habit], completions);

			expect(result.totalScheduled).toBe(10);
			expect(result.totalCompleted).toBe(5);
			expect(result.progressPercentage).toBe(50);
			expect(result.isCompleted).toBe(false);
		});

		it('returns isCompleted true when all habits completed', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-03')
			});
			const habit = createHabit({ goalId: 'goal-1', frequency: 'daily' });
			const completions = [1, 2, 3].map((d) =>
				createCompletion({ completedAt: new Date(`2025-01-0${d}T12:00:00`) })
			);

			const result = calculateGoalProgress(goal, [habit], completions);

			expect(result.isCompleted).toBe(true);
			expect(result.progressPercentage).toBe(100);
		});

		it('only includes habits attached to the goal', () => {
			const goal = createGoal();
			const attachedHabit = createHabit({ id: 'h1', goalId: 'goal-1' });
			const unattachedHabit = createHabit({ id: 'h2', goalId: 'other-goal' });

			const result = calculateGoalProgress(goal, [attachedHabit, unattachedHabit], []);

			expect(result.habits).toHaveLength(1);
			expect(result.habits[0].id).toBe('h1');
		});
	});

	describe('calculateGoalWithTodayStatus', () => {
		it('combines historical progress with today status and caps numeric progress', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-03')
			});
			const booleanHabit = createHabit({ id: 'h1', goalId: 'goal-1', measurement: 'boolean' });
			const numericHabit = createHabit({
				id: 'h2',
				goalId: 'goal-1',
				measurement: 'numeric',
				targetAmount: 10
			});

			const completions = [
				// Boolean habit completed days 1 & 2
				createCompletion({ habitId: 'h1', completedAt: new Date('2025-01-01T10:00:00') }),
				createCompletion({ habitId: 'h1', completedAt: new Date('2025-01-02T10:00:00') }),
				// Numeric habit: 0.5 + 1 + capped 1
				createCompletion({
					habitId: 'h2',
					completedAt: new Date('2025-01-01T10:00:00'),
					measurement: 5
				}),
				createCompletion({
					habitId: 'h2',
					completedAt: new Date('2025-01-02T10:00:00'),
					measurement: 10
				}),
				createCompletion({
					habitId: 'h2',
					completedAt: new Date('2025-01-03T10:00:00'),
					measurement: 12
				})
			];

			const today = new Date('2025-01-02');
			const todayStart = new Date('2025-01-02T00:00:00');
			const todayEnd = new Date('2025-01-02T23:59:59.999');
			const todayCompletions = completions.filter(
				(c) => c.completedAt >= todayStart && c.completedAt <= todayEnd
			);

			const result = calculateGoalWithTodayStatus(
				goal,
				[booleanHabit, numericHabit],
				completions,
				todayCompletions,
				today
			);

			expect(result.totalScheduled).toBe(6); // 2 habits * 3 days
			expect(result.totalCompleted).toBe(4.5); // 2 boolean + (0.5 + 1 + 1) numeric
			expect(result.progressPercentage).toBe(75);
			expect(result.isCompleted).toBe(false);
			expect(result.todayTotal).toBe(2);
			expect(result.todayCompleted).toBe(2); // boolean 1 + numeric 1 (capped)

			const todayStatuses = result.habits.map((h) => ({
				id: h.habit.id,
				isCompleted: h.isCompleted
			}));
			expect(todayStatuses).toContainEqual({ id: 'h1', isCompleted: true });
			expect(todayStatuses).toContainEqual({ id: 'h2', isCompleted: true });
		});
	});

	describe('isGoalActive', () => {
		it('returns true when date is within goal range', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-31')
			});

			expect(isGoalActive(goal, new Date('2025-01-15'))).toBe(true);
		});

		it('returns true on start date', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-31')
			});

			expect(isGoalActive(goal, new Date('2025-01-01'))).toBe(true);
		});

		it('returns true on end date', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-31')
			});

			expect(isGoalActive(goal, new Date('2025-01-31'))).toBe(true);
		});

		it('returns false before start date', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-31')
			});

			expect(isGoalActive(goal, new Date('2024-12-31'))).toBe(false);
		});

		it('returns false after end date', () => {
			const goal = createGoal({
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-01-31')
			});

			expect(isGoalActive(goal, new Date('2025-02-01'))).toBe(false);
		});
	});

	describe('filterActiveGoals', () => {
		it('returns only active goals', () => {
			const activeGoal = createGoal({
				id: 'active',
				startDate: new Date('2025-01-01'),
				endDate: new Date('2025-12-31')
			});
			const pastGoal = createGoal({
				id: 'past',
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31')
			});

			const result = filterActiveGoals([activeGoal, pastGoal], new Date('2025-06-15'));

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('active');
		});
	});

	describe('sortGoalsByEndDate', () => {
		it('sorts goals by end date ascending', () => {
			const goals = [
				createGoal({ id: 'late', endDate: new Date('2025-12-31') }),
				createGoal({ id: 'early', endDate: new Date('2025-01-31') }),
				createGoal({ id: 'mid', endDate: new Date('2025-06-30') })
			];

			const result = sortGoalsByEndDate(goals);

			expect(result.map((g) => g.id)).toEqual(['early', 'mid', 'late']);
		});

		it('does not mutate original array', () => {
			const goals = [
				createGoal({ id: 'b', endDate: new Date('2025-12-31') }),
				createGoal({ id: 'a', endDate: new Date('2025-01-31') })
			];

			sortGoalsByEndDate(goals);

			expect(goals[0].id).toBe('b'); // Original unchanged
		});
	});
});
