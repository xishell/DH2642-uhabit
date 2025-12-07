export type Habit = {
	id: string;
	userId: string;
	title: string;
	notes: string | null;
	color: string | null;
	frequency: 'daily' | 'weekly' | 'monthly';
	measurement: 'boolean' | 'numeric';
	period: number[] | null;
	targetAmount: number | null;
	unit: string | null;
	categoryId: string | null;
	goalId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type HabitCompletion = {
	id: string;
	habitId: string;
	userId: string;
	completedAt: Date;
	measurement: number | null;
	notes: string | null;
	createdAt: Date;
};

/**
 * Habit with its completion status for a specific date
 */
export type HabitWithStatus = {
	habit: Habit;
	isCompleted: boolean;
	completion: HabitCompletion | null;
	/** For numeric habits: current progress towards target */
	progress: number;
	/** For numeric habits: target amount */
	target: number | null;
};
