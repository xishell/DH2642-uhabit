import type { Habit, HabitWithStatus } from './habit';

/**
 * Base Goal type representing a user objective
 */
export type Goal = {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	color: string | null;
	startDate: Date;
	endDate: Date;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Goal with its attached habits
 */
export type GoalWithHabits = Goal & {
	habits: Habit[];
};

/**
 * Goal with progress calculation
 */
export type GoalWithProgress = GoalWithHabits & {
	/** Total scheduled habit instances within the goal date range */
	totalScheduled: number;
	/** Total completed habit instances within the goal date range */
	totalCompleted: number;
	/** Progress as a percentage (0-100) */
	progressPercentage: number;
	/** Whether all scheduled habits have been completed */
	isCompleted: boolean;
};

/**
 * Goal with habits that have today's status (for overview page)
 */
export type GoalWithHabitStatus = Goal & {
	habits: HabitWithStatus[];
	/** Today's progress for this goal */
	todayCompleted: number;
	todayTotal: number;
	/** Overall goal progress */
	totalScheduled: number;
	totalCompleted: number;
	progressPercentage: number;
	isCompleted: boolean;
};
