import type { PageServerLoad, Actions } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';
import { getHabitsForDate } from '$lib/utils/habit';
import { startOfDay, endOfDay } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const userId = locals.user!.id;

	const db = getDB(platform!.env.DB);

	// Fetch all habits for the user
	const habitsRaw = await db.select().from(habit).where(eq(habit.userId, userId));

	// Fetch all completions for today
	const todayStart = startOfDay(new Date());
	const todayEnd = endOfDay(new Date());

	const completionsRaw = await db
		.select()
		.from(habitCompletion)
		.where(
			and(
				eq(habitCompletion.userId, userId),
				gte(habitCompletion.completedAt, todayStart),
				lte(habitCompletion.completedAt, todayEnd)
			)
		);

	// Map DB results to Habit/HabitCompletion types
	const habits: Habit[] = habitsRaw.map((h: any) => ({
		...h,
		frequency: h.frequency as 'daily' | 'weekly' | 'monthly',
		measurement: h.measurement as 'boolean' | 'numeric',
		period: h.period ? JSON.parse(h.period) : null,
		createdAt: new Date(h.createdAt),
		updatedAt: new Date(h.updatedAt)
	}));

	const completions: HabitCompletion[] = completionsRaw.map((c: any) => ({
		...c,
		completedAt: new Date(c.completedAt),
		createdAt: new Date(c.createdAt)
	}));

	const habitsWithStatus: HabitWithStatus[] = getHabitsForDate(habits, completions);

	const single = habitsWithStatus.filter((h) => h.habit.measurement === 'boolean');
	const progressive = habitsWithStatus.filter((h) => h.habit.measurement === 'numeric');

	return { single, progressive };
};

export const actions: Actions = {
	toggleSingle: async ({ request, platform, locals }) => {
		if (!locals.user) return { success: false };
		const userId = locals.user.id;
		const db = getDB(platform!.env.DB);

		const form = await request.formData();
		const id = form.get('id') as string;
		const done = form.get('done') === 'true';

		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		if (done) {
			// Insert a completion for today with a required 'id'
			await db.insert(habitCompletion).values({
				id: crypto.randomUUID(), // <-- required
				habitId: id,
				userId,
				completedAt: new Date(),
				measurement: 1,
				notes: null,
				createdAt: new Date()
			});
		} else {
			// Remove today's completion if unchecked
			await db
				.delete(habitCompletion)
				.where(
					and(
						eq(habitCompletion.habitId, id),
						eq(habitCompletion.userId, userId),
						gte(habitCompletion.completedAt, todayStart),
						lte(habitCompletion.completedAt, todayEnd)
					)
				);
		}

		return { success: true };
	},

	updateProgressiveTarget: async ({ request, platform }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const targetAmount = Number(form.get('targetAmount'));

		const db = getDB(platform!.env.DB);
		// Update only the targetAmount, no 'progress' column in schema
		await db.update(habit).set({ targetAmount }).where(eq(habit.id, id));

		return { success: true };
	},

	updateProgressValue: async ({ request, platform, locals }) => {
		if (!locals.user) return { success: false };
		const userId = locals.user.id;
		const db = getDB(platform!.env.DB);

		const form = await request.formData();
		const habitId = form.get('id') as string;
		const progress = Number(form.get('progress'));

		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		// Check if there's already a completion for today
		const existing = await db
			.select()
			.from(habitCompletion)
			.where(
				and(
					eq(habitCompletion.habitId, habitId),
					eq(habitCompletion.userId, userId),
					gte(habitCompletion.completedAt, todayStart),
					lte(habitCompletion.completedAt, todayEnd)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			// Update existing completion
			await db
				.update(habitCompletion)
				.set({ measurement: progress })
				.where(eq(habitCompletion.id, existing[0].id));
		} else {
			// Create new completion
			await db.insert(habitCompletion).values({
				id: crypto.randomUUID(),
				habitId,
				userId,
				completedAt: new Date(),
				measurement: progress,
				notes: null,
				createdAt: new Date()
			});
		}

		return { success: true };
	},

	updateProgressive: async ({ request, platform, locals }) => {
		if (!locals.user) return { success: false };
		const userId = locals.user.id;
		const db = getDB(platform!.env.DB);

		const form = await request.formData();
		const habitId = form.get('id') as string;
		const progress = Number(form.get('progress'));

		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		// Check if there's already a completion for today
		const existing = await db
			.select()
			.from(habitCompletion)
			.where(
				and(
					eq(habitCompletion.habitId, habitId),
					eq(habitCompletion.userId, userId),
					gte(habitCompletion.completedAt, todayStart),
					lte(habitCompletion.completedAt, todayEnd)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			// Update existing completion
			await db
				.update(habitCompletion)
				.set({ measurement: progress })
				.where(eq(habitCompletion.id, existing[0].id));
		} else {
			// Create new completion
			await db.insert(habitCompletion).values({
				id: crypto.randomUUID(),
				habitId,
				userId,
				completedAt: new Date(),
				measurement: progress,
				notes: null,
				createdAt: new Date()
			});
		}

		return { success: true };
	}
};
