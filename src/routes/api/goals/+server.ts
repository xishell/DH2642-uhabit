import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { goal, habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, parsePagination, paginatedResponse } from '$lib/server/api-helpers';
import { startOfDay, endOfDay } from '$lib/utils/date';
import { calculateGoalProgress } from '$lib/utils/goal';
import type { Habit } from '$lib/types/habit';
import type { Goal } from '$lib/types/goal';

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

		// Fetch completions filtered by goal date ranges
		let completions: (typeof habitCompletion.$inferSelect)[] = [];
		if (habits.length > 0 && goals.length > 0) {
			const minStart = goals.reduce(
				(min, g) => (g.startDate < min ? g.startDate : min),
				goals[0].startDate
			);
			const maxEnd = goals.reduce(
				(max, g) => (g.endDate > max ? g.endDate : max),
				goals[0].endDate
			);

			completions = await db
				.select()
				.from(habitCompletion)
				.where(
					and(
						eq(habitCompletion.userId, userId),
						gte(habitCompletion.completedAt, startOfDay(minStart)),
						lte(habitCompletion.completedAt, endOfDay(maxEnd))
					)
				);
		}

		// Parse habits and calculate progress
		const parsedHabits = habits.map(parseHabit);

		const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

		setHeaders({
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
		});

		return json(paginatedResponse(goalsWithProgress, total, pagination));
	}

	// Non-paginated response
	const goals = await db
		.select()
		.from(goal)
		.where(and(...conditions));

	if (goals.length === 0) {
		setHeaders({
			'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
		});
		return json([]);
	}

	// Fetch all habits for the user that are attached to goals
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));

	// Fetch completions filtered by goal date ranges
	const minStart = goals.reduce(
		(min, g) => (g.startDate < min ? g.startDate : min),
		goals[0].startDate
	);
	const maxEnd = goals.reduce((max, g) => (g.endDate > max ? g.endDate : max), goals[0].endDate);

	const completions = await db
		.select()
		.from(habitCompletion)
		.where(
			and(
				eq(habitCompletion.userId, userId),
				gte(habitCompletion.completedAt, startOfDay(minStart)),
				lte(habitCompletion.completedAt, endOfDay(maxEnd))
			)
		);

	// Parse habits and calculate progress
	const parsedHabits = habits.map(parseHabit);

	const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

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

	const d1 = platform.env.DB;
	const db = getDB(d1);

	// Create goal
	const goalId = crypto.randomUUID();
	const now = new Date();
	const nowTimestamp = now.getTime();

	const goalData: Goal = {
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
		// Batch for atomic insert + habit attachment
		const statements: D1PreparedStatement[] = [
			d1
				.prepare(
					`INSERT INTO goal (id, userId, title, description, startDate, endDate, createdAt, updatedAt)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					goalId,
					userId,
					data.title,
					data.description || null,
					goalData.startDate.getTime(),
					goalData.endDate.getTime(),
					nowTimestamp,
					nowTimestamp
				)
		];

		if (data.habitIds && data.habitIds.length > 0) {
			// Validate ownership
			const ownedHabits = await db
				.select({ id: habit.id })
				.from(habit)
				.where(
					and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(data.habitIds, sql`, `)})`)
				);

			const ownedIds = new Set(ownedHabits.map((h) => h.id));
			const validHabitIds = data.habitIds.filter((id) => ownedIds.has(id));

			for (const habitId of validHabitIds) {
				statements.push(
					d1
						.prepare(`UPDATE habit SET goalId = ?, updatedAt = ? WHERE id = ? AND userId = ?`)
						.bind(goalId, nowTimestamp, habitId, userId)
				);
			}
		}

		await d1.batch(statements);
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
