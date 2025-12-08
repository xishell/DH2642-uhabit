import type { PageServerLoad, Actions } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';
import { getHabitsForDate } from '$lib/utils/habit';
import { startOfDay, endOfDay } from '$lib/utils/date';

const IS_DEV = import.meta.env.MODE === 'development';

export const load: PageServerLoad = async ({ locals, platform, cookies }) => {
	// Read UI state from cookies
	const savedTab = cookies.get('overview-tab') as 'single' | 'progressive' | undefined;
	const savedModal = cookies.get('overview-modal');

	let initialTab: 'single' | 'progressive' = 'single';
	let initialModal: { habitId: string; progress: number } | null = null;

	if (savedTab === 'single' || savedTab === 'progressive') {
		initialTab = savedTab;
	}

	if (savedModal) {
		try {
			initialModal = JSON.parse(savedModal);
		} catch {
			// Invalid JSON, ignore
		}
	}

	// Mock user for development
	const user = locals.user ?? (IS_DEV ? { id: 'dev-user-123', name: 'Dev User' } : null);

	if (!user) return { single: [], progressive: [], initialTab, initialModal };

	// Skip DB entirely in dev
	if (IS_DEV) {
		return { single: [], progressive: [], initialTab, initialModal };
	}

	const db = getDB(platform!.env.DB);

	const habitsRaw = await db.select().from(habit).where(eq(habit.userId, user.id));
	const todayStart = startOfDay(new Date());
	const todayEnd = endOfDay(new Date());
	const completionsRaw = await db
		.select()
		.from(habitCompletion)
		.where(
			and(
				eq(habitCompletion.userId, user.id),
				gte(habitCompletion.completedAt, todayStart),
				lte(habitCompletion.completedAt, todayEnd)
			)
		);

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
	return {
		single: habitsWithStatus.filter((h) => h.habit.measurement === 'boolean'),
		progressive: habitsWithStatus.filter((h) => h.habit.measurement === 'numeric'),
		initialTab,
		initialModal
	};
};

export const actions: Actions = {
	toggleSingle: async ({ request, platform, locals }) => {
		const user = locals.user ?? (IS_DEV ? { id: 'dev-user-123' } : null);
		if (!user) return { success: false };

		if (IS_DEV) {
			console.log('toggleSingle called in dev, skipping DB');
			return { success: true };
		}

		const db = getDB(platform!.env.DB);
		const form = await request.formData();
		const id = form.get('id') as string;
		const done = form.get('done') === 'true';

		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		if (done) {
			await db.insert(habitCompletion).values({
				id: crypto.randomUUID(),
				habitId: id,
				userId: user.id,
				completedAt: new Date(),
				measurement: 1,
				notes: null,
				createdAt: new Date()
			});
		} else {
			await db
				.delete(habitCompletion)
				.where(
					and(
						eq(habitCompletion.habitId, id),
						eq(habitCompletion.userId, user.id),
						gte(habitCompletion.completedAt, todayStart),
						lte(habitCompletion.completedAt, todayEnd)
					)
				);
		}

		return { success: true };
	},

	updateProgressiveTarget: async ({ request, platform }) => {
		if (IS_DEV) {
			console.log('updateProgressiveTarget called in dev, skipping DB');
			return { success: true };
		}

		const form = await request.formData();
		const id = form.get('id') as string;
		const targetAmount = Number(form.get('targetAmount'));
		const db = getDB(platform!.env.DB);

		await db.update(habit).set({ targetAmount }).where(eq(habit.id, id));
		return { success: true };
	},

	updateProgressValue: async ({ request, platform, locals }) => {
		const user = locals.user ?? (IS_DEV ? { id: 'dev-user-123' } : null);
		if (!user) return { success: false };

		if (IS_DEV) {
			console.log('updateProgressValue called in dev, skipping DB');
			return { success: true };
		}

		const db = getDB(platform!.env.DB);
		const form = await request.formData();
		const habitId = form.get('id') as string;
		const progress = Number(form.get('progress'));

		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		const existing = await db
			.select()
			.from(habitCompletion)
			.where(
				and(
					eq(habitCompletion.habitId, habitId),
					eq(habitCompletion.userId, user.id),
					gte(habitCompletion.completedAt, todayStart),
					lte(habitCompletion.completedAt, todayEnd)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			await db
				.update(habitCompletion)
				.set({ measurement: progress })
				.where(eq(habitCompletion.id, existing[0].id));
		} else {
			await db.insert(habitCompletion).values({
				id: crypto.randomUUID(),
				habitId,
				userId: user.id,
				completedAt: new Date(),
				measurement: progress,
				notes: null,
				createdAt: new Date()
			});
		}

		return { success: true };
	}
};
