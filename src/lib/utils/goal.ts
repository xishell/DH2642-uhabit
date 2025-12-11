/**
 * Goal utility functions for progress calculation
 */

import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';
import type { Goal, GoalWithHabits, GoalWithProgress, GoalWithHabitStatus } from '$lib/types/goal';
import { startOfDay, endOfDay } from './date';
import { shouldShowHabitOnDate, getCompletionsForHabitOnDate } from './habit';

/**
 * Get all dates between start and end (inclusive)
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
	const dates: Date[] = [];
	const current = startOfDay(new Date(startDate));
	const end = startOfDay(new Date(endDate));

	while (current <= end) {
		dates.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

/**
 * Get all scheduled dates for a habit within a date range
 */
export function getScheduledDatesForHabit(habit: Habit, startDate: Date, endDate: Date): Date[] {
	const allDates = getDateRange(startDate, endDate);
	return allDates.filter((date) => shouldShowHabitOnDate(habit, date));
}

/**
 * Count completed instances for a habit within a date range
 */
// Returns completion units for a habit across its scheduled dates.
// Boolean habits give 0/1 per day; numeric add a fraction of target (max 1).
export function completionUnitsForHabit(
	habit: Habit,
	completions: HabitCompletion[],
	startDate: Date,
	endDate: Date
): number {
	const scheduledDates = getScheduledDatesForHabit(habit, startDate, endDate);
	let units = 0;

	for (const date of scheduledDates) {
		const dayCompletions = getCompletionsForHabitOnDate(habit.id, completions, date);

		if (habit.measurement === 'boolean') {
			units += dayCompletions.length > 0 ? 1 : 0;
		} else {
			const target = habit.targetAmount ?? 0;
			if (target <= 0) continue;
			const totalProgress = dayCompletions.reduce((sum, c) => sum + (c.measurement ?? 0), 0);
			units += Math.min(1, totalProgress / target);
		}
	}

	return units;
}

/**
 * Calculate progress for a goal based on its habits and completions
 */
export function calculateGoalProgress(
	goal: Goal,
	habits: Habit[],
	completions: HabitCompletion[]
): GoalWithProgress {
	// Filter habits attached to this goal
	const goalHabits = habits.filter((h) => h.goalId === goal.id);

	let totalScheduled = 0;
	let totalCompleted = 0;

	for (const habit of goalHabits) {
		const scheduledDates = getScheduledDatesForHabit(habit, goal.startDate, goal.endDate);
		totalScheduled += scheduledDates.length;
		totalCompleted += completionUnitsForHabit(habit, completions, goal.startDate, goal.endDate);
	}

	const progressPercentage =
		totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

	return {
		...goal,
		habits: goalHabits,
		totalScheduled,
		totalCompleted,
		progressPercentage,
		isCompleted: totalScheduled > 0 && totalCompleted >= totalScheduled
	};
}

/**
 * Calculate goal progress with today's habit status (for overview page)
 */
export function calculateGoalWithTodayStatus(
	goal: Goal,
	habits: Habit[],
	completions: HabitCompletion[],
	todayCompletions: HabitCompletion[],
	today: Date = new Date()
): GoalWithHabitStatus {
	// Filter habits attached to this goal
	const goalHabits = habits.filter((h) => h.goalId === goal.id);

	// Calculate overall goal progress
	let totalScheduled = 0;
	let totalCompleted = 0;

	for (const habit of goalHabits) {
		const scheduledDates = getScheduledDatesForHabit(habit, goal.startDate, goal.endDate);
		totalScheduled += scheduledDates.length;
		totalCompleted += completionUnitsForHabit(habit, completions, goal.startDate, goal.endDate);
	}

	// Calculate today's status for each habit
	const habitsWithStatus: HabitWithStatus[] = goalHabits
		.filter((habit) => shouldShowHabitOnDate(habit, today))
		.map((habit) => {
			const dayCompletions = getCompletionsForHabitOnDate(habit.id, todayCompletions, today);

			if (habit.measurement === 'boolean') {
				const isCompleted = dayCompletions.length > 0;
				return {
					habit,
					isCompleted,
					completion: dayCompletions[0] ?? null,
					progress: isCompleted ? 1 : 0,
					target: null
				};
			} else {
				const totalProgress = dayCompletions.reduce((sum, c) => sum + (c.measurement ?? 0), 0);
				const target = habit.targetAmount ?? 0;
				return {
					habit,
					isCompleted: target > 0 && totalProgress >= target,
					completion: dayCompletions[0] ?? null,
					progress: totalProgress,
					target: habit.targetAmount
				};
			}
		});

	const todayCompletedUnits = habitsWithStatus.reduce((sum, h) => {
		if (h.habit.measurement === 'boolean') {
			return sum + (h.isCompleted ? 1 : 0);
		}
		const target = h.target ?? h.habit.targetAmount ?? 0;
		if (target <= 0) return sum + (h.isCompleted ? 1 : 0);
		return sum + Math.min(1, h.progress / target);
	}, 0);
	const todayTotal = habitsWithStatus.length;

	const progressPercentage =
		totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

	return {
		...goal,
		habits: habitsWithStatus,
		todayCompleted: todayCompletedUnits,
		todayTotal,
		totalScheduled,
		totalCompleted,
		progressPercentage,
		isCompleted: totalScheduled > 0 && totalCompleted >= totalScheduled
	};
}

/**
 * Check if a goal is active (today falls within the goal's date range)
 */
export function isGoalActive(goal: Goal, date: Date = new Date()): boolean {
	const today = startOfDay(date);
	const start = startOfDay(new Date(goal.startDate));
	const end = endOfDay(new Date(goal.endDate));

	return today >= start && today <= end;
}

/**
 * Filter goals to only active ones
 */
export function filterActiveGoals(goals: Goal[], date: Date = new Date()): Goal[] {
	return goals.filter((goal) => isGoalActive(goal, date));
}

/**
 * Sort goals by end date (soonest first)
 */
export function sortGoalsByEndDate(goals: Goal[]): Goal[] {
	return [...goals].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
}
