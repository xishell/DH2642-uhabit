import type { PageServerLoad, Actions } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion, goal } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Habit, HabitCompletion, HabitWithStatus } from '$lib/types/habit';
import type { GoalWithHabitStatus } from '$lib/types/goal';
import { getHabitsForDate } from '$lib/utils/habit';
import { startOfDay, endOfDay } from '$lib/utils/date';
import { isGoalActive } from '$lib/utils/goal';

const IS_DEV = import.meta.env.MODE === 'development';

export const load: PageServerLoad = async ({ locals, platform, cookies }) => {
	// Read UI state from cookies
	const savedTab = cookies.get('overview-tab') as 'tasks' | 'goals' | undefined;
	const savedModal = cookies.get('overview-modal');

	let initialTab: 'tasks' | 'goals' = 'tasks';
	let initialModal: { habitId: string; progress: number } | null = null;

	if (savedTab === 'tasks' || savedTab === 'goals') {
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

	if (!user) return { habits: [], goals: [], initialTab, initialModal };

	const db = getDB(platform!.env.DB);

	const today = new Date();
	const todayStart = startOfDay(today);
	const todayEnd = endOfDay(today);

	// Fetch all habits
	const habitsRaw = await db.select().from(habit).where(eq(habit.userId, user.id));

	// Fetch today's completions
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

	// Fetch all goals
	const goalsRaw = await db.select().from(goal).where(eq(goal.userId, user.id));

	// Parse habits
	const habits: Habit[] = habitsRaw.map((h: any) => ({
		...h,
		frequency: h.frequency as 'daily' | 'weekly' | 'monthly',
		measurement: h.measurement as 'boolean' | 'numeric',
		period: h.period ? JSON.parse(h.period) : null,
		createdAt: new Date(h.createdAt),
		updatedAt: new Date(h.updatedAt)
	}));

	// Parse completions
	const completions: HabitCompletion[] = completionsRaw.map((c: any) => ({
		...c,
		completedAt: new Date(c.completedAt),
		createdAt: new Date(c.createdAt)
	}));

	// Get habits with today's status (filters to only habits due today)
	const habitsWithStatus: HabitWithStatus[] = getHabitsForDate(habits, completions);

	// Build goals with habit status
	const goalsWithStatus: GoalWithHabitStatus[] = goalsRaw
		.map((g: any) => {
			const goalData = {
				...g,
				startDate: new Date(g.startDate),
				endDate: new Date(g.endDate),
				createdAt: new Date(g.createdAt),
				updatedAt: new Date(g.updatedAt)
			};

			// Only include active goals
			if (!isGoalActive(goalData)) {
				return null;
			}

			// Get habits attached to this goal
			const goalHabits = habitsWithStatus.filter((h) => h.habit.goalId === g.id);

			// Calculate today's progress
			const todayCompleted = goalHabits.filter((h) => h.isCompleted).length;
			const todayTotal = goalHabits.length;

			// Overall progress (simplified - just today's for now)
			const progressPercentage = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

			return {
				...goalData,
				habits: goalHabits,
				todayCompleted,
				todayTotal,
				totalScheduled: todayTotal,
				totalCompleted: todayCompleted,
				progressPercentage,
				isCompleted: todayTotal > 0 && todayCompleted === todayTotal
			} as GoalWithHabitStatus;
		})
		.filter((g): g is GoalWithHabitStatus => g !== null);

	return {
		habits: habitsWithStatus,
		goals: goalsWithStatus,
		initialTab,
		initialModal
	};
};

export const actions: Actions = {
	toggleSingle: async ({ request, platform, locals }) => {
		const user = locals.user ?? (IS_DEV ? { id: 'dev-user-123' } : null);
		if (!user) return { success: false };

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
