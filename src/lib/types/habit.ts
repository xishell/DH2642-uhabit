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
