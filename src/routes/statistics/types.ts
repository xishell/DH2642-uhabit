export type Habit = {
	habitTitle: string;
	completionRate: number;
};

export type HabitStat = {
	date: string;
	data: Habit[];
};

export type HabitType = 'daily' | 'weekly' | 'monthly';
