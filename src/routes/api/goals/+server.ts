import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { goal, habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, parsePagination, paginatedResponse } from '$lib/server/api-helpers';
import { startOfDay } from '$lib/utils/date';
import { calculateGoalProgress } from '$lib/utils/goal';
import type { Habit } from '$lib/types/habit';

// Parse habit from DB (handles JSON period/type casts)
function parseHabit(h: typeof habit.$inferSelect): Habit {
	return {
		...h,
		frequency: h.frequency as Habit['frequency'],
		measurement: h.measurement as Habit['measurement'],
		period: h.period ? JSON.parse(h.period) : null
	};
}

// Validation schema for goal creation
const createGoalSchema = z
	.object({
		title: z.string().min(1).max(255),
		description: z.string().nullish(),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
		habitIds: z.array(z.string().uuid()).optional()
	})
	.refine((data) => new Date(data.endDate) > new Date(data.startDate), {
		message: 'End date must be after start date',
		path: ['endDate']
	});

// GET /api/goals - List all goals for authenticated user with habits
export const GET: RequestHandler = async ({ locals, platform, setHeaders, url }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Check if pagination is requested
	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');

	// Check if we should only return active goals
	const activeOnly = url.searchParams.get('active') === 'true';

	// Cache privately
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	// Build base query conditions
	const conditions = [eq(goal.userId, userId)];

	if (activeOnly) {
		const today = startOfDay(new Date());
		conditions.push(lte(goal.startDate, today));
		conditions.push(gte(goal.endDate, today));
	}

	if (usePagination) {
		const pagination = parsePagination(url);

		// Get total count
		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(goal)
			.where(and(...conditions));
		const total = Number(countResult?.count ?? 0);

		// Fetch paginated goals
		const goals = await db
			.select()
			.from(goal)
			.where(and(...conditions))
			.limit(pagination.limit)
			.offset(pagination.offset);

		// Fetch habits for these goals
		const goalIds = goals.map((g) => g.id);
		const habits =
			goalIds.length > 0
				? await db
						.select()
						.from(habit)
						.where(
							and(eq(habit.userId, userId), sql`${habit.goalId} IN (${sql.join(goalIds, sql`, `)})`)
						)
				: [];

		// Fetch completions for progress calculation
		const completions =
			habits.length > 0
				? await db.select().from(habitCompletion).where(eq(habitCompletion.userId, userId))
				: [];

		// Parse habits and calculate progress
		const parsedHabits = habits.map(parseHabit);

		const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

		return json(paginatedResponse(goalsWithProgress, total, pagination));
	}

	// Non-paginated response
	const goals = await db
		.select()
		.from(goal)
		.where(and(...conditions));

	// Fetch all habits for the user that are attached to goals
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));

	// Fetch all completions
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.userId, userId));

	// Parse habits and calculate progress
	const parsedHabits = habits.map(parseHabit);

	const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

	return json(goalsWithProgress);
};

// POST /api/goals - Create new goal
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const userId = requireAuth(locals);

	// Parse and validate request body
	const body = await request.json();
	const validationResult = createGoalSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	if (!platform?.env?.DB) {
		throw error(500, 'Database not configured');
	}

	const db = getDB(platform.env.DB);

	// Create goal
	const goalId = crypto.randomUUID();
	const now = new Date();

	const goalData = {
		id: goalId,
		userId,
		title: data.title,
		description: data.description || null,
		startDate: new Date(data.startDate + 'T00:00:00Z'),
		endDate: new Date(data.endDate + 'T23:59:59Z'),
		createdAt: now,
		updatedAt: now
	};

	try {
		await db.insert(goal).values(goalData);

		// If habitIds provided, attach habits to goal
		if (data.habitIds && data.habitIds.length > 0) {
			await db
				.update(habit)
				.set({ goalId, updatedAt: now })
				.where(
					and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(data.habitIds, sql`, `)})`)
				);
		}
	} catch (err) {
		console.error('Insert error:', err);
		throw error(500, 'Failed to create goal: ' + (err as Error).message);
	}

	// Fetch attached habits to return with the goal
	const attachedHabits = await db.select().from(habit).where(eq(habit.goalId, goalId));

	const parsedHabits = attachedHabits.map(parseHabit);

	return json(
		{
			...goalData,
			habits: parsedHabits,
			totalScheduled: 0,
			totalCompleted: 0,
			progressPercentage: 0,
			isCompleted: false
		},
		{ status: 201 }
	);
};
