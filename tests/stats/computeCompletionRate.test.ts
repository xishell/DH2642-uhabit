import { describe, it, expect, beforeEach } from 'vitest';
import { computeCompletionRate, computeDailyRates } from '$lib/stats/computeCompletionRate';
import {
	resetIds,
	createHabit,
	createNumericHabit,
	createWeeklyHabit,
	createCompletionsForRange,
	createNumericCompletion,
	createDateRange,
	today,
	daysAgo
} from './testUtils';

describe('computeCompletionRate', () => {
	beforeEach(() => {
		resetIds();
	});

	describe('empty states', () => {
		it('returns 0 rate for no habits', () => {
			const range = createDateRange(daysAgo(6), 7);
			const result = computeCompletionRate([], [], range);

			expect(result.rate).toBe(0);
			expect(result.completed).toBe(0);
			expect(result.total).toBe(0);
		});

		it('returns 0 rate for no completions', () => {
			const habit = createHabit();
			const range = createDateRange(daysAgo(6), 7);
			const result = computeCompletionRate([habit], [], range);

			expect(result.rate).toBe(0);
			expect(result.completed).toBe(0);
			expect(result.total).toBe(7); // 7 days of daily habit
		});
	});

	describe('boolean habits', () => {
		it('calculates 100% rate for perfect week', () => {
			const habit = createHabit();
			const range = createDateRange(daysAgo(6), 7);
			const completions = createCompletionsForRange(habit.id, range.from, 7);

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(1);
			expect(result.completed).toBe(7);
			expect(result.total).toBe(7);
		});

		it('calculates partial rate correctly', () => {
			const habit = createHabit();
			const range = createDateRange(daysAgo(6), 7);
			// Skip days 2 and 5 (5 completions out of 7)
			const completions = createCompletionsForRange(habit.id, range.from, 7, [2, 5]);

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBeCloseTo(5 / 7);
			expect(result.completed).toBe(5);
			expect(result.total).toBe(7);
		});

		it('handles multiple habits', () => {
			const habit1 = createHabit();
			const habit2 = createHabit();
			const range = createDateRange(daysAgo(6), 7);

			// habit1: 7/7, habit2: 3/7
			const completions = [
				...createCompletionsForRange(habit1.id, range.from, 7),
				...createCompletionsForRange(habit2.id, range.from, 7, [0, 2, 4, 6])
			];

			const result = computeCompletionRate([habit1, habit2], completions, range);

			expect(result.completed).toBe(10); // 7 + 3
			expect(result.total).toBe(14); // 7 + 7
			expect(result.rate).toBeCloseTo(10 / 14);
		});

		it('provides per-habit breakdown', () => {
			const habit1 = createHabit({ title: 'Habit 1' });
			const habit2 = createHabit({ title: 'Habit 2' });
			const range = createDateRange(daysAgo(6), 7);

			const completions = [
				...createCompletionsForRange(habit1.id, range.from, 7), // 100%
				...createCompletionsForRange(habit2.id, range.from, 7, [0, 1, 2, 3]) // 3/7
			];

			const result = computeCompletionRate([habit1, habit2], completions, range);

			expect(result.byHabit.get(habit1.id)?.rate).toBe(1);
			expect(result.byHabit.get(habit2.id)?.rate).toBeCloseTo(3 / 7);
		});
	});

	describe('numeric habits', () => {
		it('counts completion when target reached', () => {
			const habit = createNumericHabit(8, 'glasses');
			const range = createDateRange(today(), 1);

			const completions = [createNumericCompletion(habit.id, today(), 8)];

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(1);
			expect(result.completed).toBe(1);
		});

		it('counts completion when target exceeded', () => {
			const habit = createNumericHabit(8, 'glasses');
			const range = createDateRange(today(), 1);

			const completions = [createNumericCompletion(habit.id, today(), 10)];

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(1);
		});

		it('does not count when target not reached', () => {
			const habit = createNumericHabit(8, 'glasses');
			const range = createDateRange(today(), 1);

			const completions = [createNumericCompletion(habit.id, today(), 5)];

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(0);
			expect(result.completed).toBe(0);
		});

		it('sums multiple completions on same day', () => {
			const habit = createNumericHabit(8, 'glasses');
			const range = createDateRange(today(), 1);

			// 3 + 3 + 3 = 9 >= 8
			const completions = [
				createNumericCompletion(habit.id, today(), 3),
				createNumericCompletion(habit.id, today(), 3),
				createNumericCompletion(habit.id, today(), 3)
			];

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(1);
		});
	});

	describe('weekly habits', () => {
		it('only counts scheduled days', () => {
			// Mon, Wed, Fri = 3 days per week
			const habit = createWeeklyHabit([1, 3, 5]);
			const range = createDateRange(daysAgo(6), 7);

			// Complete all 7 days
			const completions = createCompletionsForRange(habit.id, range.from, 7);

			const result = computeCompletionRate([habit], completions, range);

			// Should only count 3 scheduled days (Mon, Wed, Fri)
			expect(result.total).toBeLessThanOrEqual(4); // Max 3-4 depending on week start
			expect(result.completed).toBeLessThanOrEqual(result.total);
		});
	});

	describe('edge cases', () => {
		it('handles single day range', () => {
			const habit = createHabit();
			const range = createDateRange(today(), 1);
			const completions = createCompletionsForRange(habit.id, today(), 1);

			const result = computeCompletionRate([habit], completions, range);

			expect(result.rate).toBe(1);
			expect(result.total).toBe(1);
		});

		it('handles very long range (365 days)', () => {
			const habit = createHabit();
			const range = createDateRange(daysAgo(364), 365);
			// 50% completion rate
			const completions = createCompletionsForRange(
				habit.id,
				range.from,
				365,
				Array.from({ length: 182 }, (_, i) => i * 2) // Skip every other day
			);

			const result = computeCompletionRate([habit], completions, range);

			expect(result.total).toBe(365);
			expect(result.completed).toBe(183);
			expect(result.rate).toBeCloseTo(183 / 365);
		});
	});
});

describe('computeDailyRates', () => {
	beforeEach(() => {
		resetIds();
	});

	it('returns array of daily rates', () => {
		const habit = createHabit();
		const range = createDateRange(daysAgo(6), 7);
		// Skip days 2 and 5
		const completions = createCompletionsForRange(habit.id, range.from, 7, [2, 5]);

		const result = computeDailyRates([habit], completions, range);

		expect(result).toHaveLength(7);
		expect(result[0]).toBe(1); // Day 0 completed
		expect(result[2]).toBe(0); // Day 2 skipped
		expect(result[5]).toBe(0); // Day 5 skipped
	});

	it('handles multiple habits per day', () => {
		const habit1 = createHabit();
		const habit2 = createHabit();
		const range = createDateRange(today(), 1);

		// Only habit1 completed
		const completions = createCompletionsForRange(habit1.id, today(), 1);

		const result = computeDailyRates([habit1, habit2], completions, range);

		expect(result[0]).toBe(0.5); // 1 of 2 habits
	});
});
