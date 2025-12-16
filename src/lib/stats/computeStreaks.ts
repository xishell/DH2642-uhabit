/**
 * Streak computation for habits
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { StreakResult } from './types';
import { shouldShowHabitOnDate } from '$lib/utils/habit';
import { formatDate, startOfDay } from '$lib/utils/date';

type StreakState = {
	current: number;
	longest: number;
	temp: number;
	startDate: Date | null;
	tempStart: Date | null;
	isActive: boolean;
};

function createStreakState(): StreakState {
	return { current: 0, longest: 0, temp: 0, startDate: null, tempStart: null, isActive: true };
}

function handleStreakHit(state: StreakState, date: Date): void {
	state.temp++;
	if (!state.tempStart) state.tempStart = new Date(date);
}

function handleStreakMiss(state: StreakState): void {
	if (state.temp > state.longest) state.longest = state.temp;
	if (state.isActive) {
		state.current = state.temp;
		state.startDate = state.tempStart;
		state.isActive = false;
	}
	state.temp = 0;
	state.tempStart = null;
}

function finalizeStreak(state: StreakState): StreakResult {
	if (state.temp > state.longest) state.longest = state.temp;
	if (state.isActive && state.temp > 0) {
		state.current = state.temp;
		state.startDate = state.tempStart;
	}
	return {
		currentStreak: state.current,
		longestStreak: state.longest,
		streakStartDate: state.startDate
	};
}

export function computeHabitStreak(
	habit: Habit,
	completions: HabitCompletion[],
	asOfDate: Date = new Date()
): StreakResult {
	const habitCompletions = completions.filter((c) => c.habitId === habit.id);
	if (habitCompletions.length === 0) {
		return { currentStreak: 0, longestStreak: 0, streakStartDate: null };
	}

	const completionDates = new Set(habitCompletions.map((c) => formatDate(new Date(c.completedAt))));
	const state = createStreakState();
	const checkDate = startOfDay(asOfDate);

	for (let i = 0; i < 365; i++) {
		if (shouldShowHabitOnDate(habit, checkDate)) {
			if (completionDates.has(formatDate(checkDate))) {
				handleStreakHit(state, checkDate);
			} else {
				handleStreakMiss(state);
			}
		}
		checkDate.setDate(checkDate.getDate() - 1);
	}

	return finalizeStreak(state);
}

function indexCompletionsByDate(completions: HabitCompletion[]): Map<string, Set<string>> {
	const index = new Map<string, Set<string>>();
	for (const completion of completions) {
		const dateStr = formatDate(new Date(completion.completedAt));
		if (!index.has(dateStr)) index.set(dateStr, new Set());
		index.get(dateStr)!.add(completion.habitId);
	}
	return index;
}

export function computeOverallStreak(
	habits: Habit[],
	completions: HabitCompletion[],
	asOfDate: Date = new Date()
): StreakResult {
	if (habits.length === 0 || completions.length === 0) {
		return { currentStreak: 0, longestStreak: 0, streakStartDate: null };
	}

	const completionsByDate = indexCompletionsByDate(completions);
	const state = createStreakState();
	const checkDate = startOfDay(asOfDate);

	for (let i = 0; i < 365; i++) {
		const dateStr = formatDate(checkDate);
		const scheduledHabits = habits.filter((h) => shouldShowHabitOnDate(h, checkDate));

		if (scheduledHabits.length > 0) {
			const completedIds = completionsByDate.get(dateStr) || new Set();
			const hasAnyCompletion = scheduledHabits.some((h) => completedIds.has(h.id));

			if (hasAnyCompletion) {
				handleStreakHit(state, checkDate);
			} else {
				handleStreakMiss(state);
			}
		}
		checkDate.setDate(checkDate.getDate() - 1);
	}

	return finalizeStreak(state);
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
