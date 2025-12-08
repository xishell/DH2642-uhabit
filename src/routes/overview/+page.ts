import type { HabitWithStatus } from '$lib/types/habit';

export const load = ({
	data
}: {
	data: { single: HabitWithStatus[]; progressive: HabitWithStatus[] };
}) => {
	return {
		single: data.single,
		progressive: data.progressive
	};
};
