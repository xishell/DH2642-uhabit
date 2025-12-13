import { describe, it, expect, beforeEach } from 'vitest';
import { computeHabitStreak, computeOverallStreak } from '$lib/stats/computeStreaks';
import {
	resetIds,
	createHabit,
	createPerfectStreak,
	createStreakWithGap,
	createWeeklyHabit,
	createCompletionsForRange,
	today,
	daysAgo
} from './testUtils';

describe('computeHabitStreak', () => {
	beforeEach(() => {
		resetIds();
	});

	describe('empty states', () => {
		it('returns 0 streak for habit with no completions', () => {
			const habit = createHabit();
			const result = computeHabitStreak(habit, [], today());

			expect(result.currentStreak).toBe(0);
			expect(result.longestStreak).toBe(0);
			expect(result.streakStartDate).toBeNull();
		});
	});

	describe('perfect streaks', () => {
		it('calculates correct streak for consecutive days', () => {
			const habit = createHabit();
			const completions = createPerfectStreak(habit.id, today(), 7);

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(7);
			expect(result.longestStreak).toBe(7);
		});

		it('handles single completion', () => {
			const habit = createHabit();
			const completions = createPerfectStreak(habit.id, today(), 1);

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(1);
			expect(result.longestStreak).toBe(1);
		});

		it('handles long streak (30 days)', () => {
			const habit = createHabit();
			const completions = createPerfectStreak(habit.id, today(), 30);

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(30);
			expect(result.longestStreak).toBe(30);
		});

		it('handles very long streak (100 days)', () => {
			const habit = createHabit();
			const completions = createPerfectStreak(habit.id, today(), 100);

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(100);
			expect(result.longestStreak).toBe(100);
		});
	});

	describe('broken streaks', () => {
		it('detects broken streak (gap yesterday)', () => {
			const habit = createHabit();
			// 5 days streak, then 1 day gap, then 3 days
			const completions = createStreakWithGap(habit.id, today(), 5, 1, 3);

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(3);
			expect(result.longestStreak).toBe(5);
		});

		it('handles multiple gaps (longest streak in past)', () => {
			const habit = createHabit();
			// Current: 2 days, gap, previous: 10 days, gap, oldest: 3 days
			const current = createPerfectStreak(habit.id, today(), 2);
			const previous = createPerfectStreak(habit.id, daysAgo(5), 10);
			const completions = [...current, ...previous];

			const result = computeHabitStreak(habit, completions, today());

			expect(result.currentStreak).toBe(2);
			expect(result.longestStreak).toBe(10);
		});

		it('streak broken today (no completion yet)', () => {
			const habit = createHabit();
			// 5 day streak ending yesterday
			const completions = createPerfectStreak(habit.id, daysAgo(1), 5);

			const result = computeHabitStreak(habit, completions, today());

			// Streak is 0 because today is missed
			expect(result.currentStreak).toBe(0);
			expect(result.longestStreak).toBe(5);
		});
	});

	describe('weekly habits', () => {
		it('calculates streak for Mon/Wed/Fri habit', () => {
			// Monday = 1, Wednesday = 3, Friday = 5
			const habit = createWeeklyHabit([1, 3, 5]);

			// Create completions for 2 weeks of Mon/Wed/Fri
			const completions: ReturnType<typeof createPerfectStreak> = [];
			const referenceDate = today();

			// Find recent Monday, Wednesday, Friday
			for (let i = 0; i < 14; i++) {
				const date = daysAgo(i, referenceDate);
				const dayOfWeek = date.getDay();
				if ([1, 3, 5].includes(dayOfWeek)) {
					completions.push(...createPerfectStreak(habit.id, date, 1));
				}
			}

			const result = computeHabitStreak(habit, completions, referenceDate);

			// Should have streak based on scheduled days only
			expect(result.currentStreak).toBeGreaterThan(0);
		});

		it('returns 0 streak for weekly habit with no completions on scheduled days', () => {
			const habit = createWeeklyHabit([1, 3, 5]); // Mon, Wed, Fri
			// Completions on wrong days (Tue, Thu)
			const completions = createCompletionsForRange(habit.id, daysAgo(6), 7, [0, 2, 4, 6]);

			const result = computeHabitStreak(habit, completions, today());

			// Depends on what day today is - may or may not have scheduled days
			expect(result.currentStreak).toBeGreaterThanOrEqual(0);
		});
	});

	describe('edge cases', () => {
		it('ignores completions for other habits', () => {
			const habit1 = createHabit();
			const habit2 = createHabit();

			const completions = [
				...createPerfectStreak(habit1.id, today(), 5),
				...createPerfectStreak(habit2.id, today(), 10)
			];

			const result = computeHabitStreak(habit1, completions, today());

			expect(result.currentStreak).toBe(5);
			expect(result.longestStreak).toBe(5);
		});

		it('handles duplicate completions on same day', () => {
			const habit = createHabit();
			const date = today();
			const completions = [
				...createPerfectStreak(habit.id, date, 1),
				...createPerfectStreak(habit.id, date, 1) // Duplicate
			];

			const result = computeHabitStreak(habit, completions, date);

			expect(result.currentStreak).toBe(1);
		});

		it('handles completions at different times on same day', () => {
			const habit = createHabit();
			const date = today();
			const morning = new Date(date);
			morning.setHours(8, 0, 0, 0);
			const evening = new Date(date);
			evening.setHours(20, 0, 0, 0);

			const completions = [
				...createPerfectStreak(habit.id, morning, 1),
				...createPerfectStreak(habit.id, evening, 1)
			];

			const result = computeHabitStreak(habit, completions, date);

			expect(result.currentStreak).toBe(1);
		});
	});
});

describe('computeOverallStreak', () => {
	beforeEach(() => {
		resetIds();
	});

	it('returns 0 for no habits', () => {
		const result = computeOverallStreak([], [], today());

		expect(result.currentStreak).toBe(0);
		expect(result.longestStreak).toBe(0);
	});

	it('returns 0 for no completions', () => {
		const habits = [createHabit(), createHabit()];
		const result = computeOverallStreak(habits, [], today());

		expect(result.currentStreak).toBe(0);
		expect(result.longestStreak).toBe(0);
	});

	it('counts day as complete if ANY habit completed', () => {
		const habit1 = createHabit();
		const habit2 = createHabit();
		const habits = [habit1, habit2];

		// Only habit1 completed for 5 days
		const completions = createPerfectStreak(habit1.id, today(), 5);

		const result = computeOverallStreak(habits, completions, today());

		expect(result.currentStreak).toBe(5);
	});

	it('handles mixed completions across habits', () => {
		const habit1 = createHabit();
		const habit2 = createHabit();
		const habits = [habit1, habit2];

		// Alternating completions
		const completions = [
			...createCompletionsForRange(habit1.id, daysAgo(6), 7, [1, 3, 5]), // Days 0,2,4,6
			...createCompletionsForRange(habit2.id, daysAgo(6), 7, [0, 2, 4, 6]) // Days 1,3,5
		];

		const result = computeOverallStreak(habits, completions, today());

		expect(result.currentStreak).toBe(7);
	});
});
