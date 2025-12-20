import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { goal, habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
	requireAuth,
	requireDB,
	parsePagination,
	paginatedResponse,
	enforceApiRateLimit,
	parseHabitFromDB
} from '$lib/server/api-helpers';
import { startOfDay, endOfDay } from '$lib/utils/date';
import { calculateGoalProgress } from '$lib/utils/goal';
import type { Goal } from '$lib/types/goal';

// Validation schema for goal creation
const createGoalSchema = z
	.object({
		title: z.string().min(1).max(255),
		description: z.string().nullish(),
		color: z.string().nullish(),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
		habitIds: z.array(z.string().uuid()).optional()
	})
	.refine((data) => new Date(data.endDate) > new Date(data.startDate), {
		message: 'End date must be after start date',
		path: ['endDate']
	});

function generateGoalsETag(goals: (typeof goal.$inferSelect)[], userId: string): string {
	if (goals.length === 0) return '"empty"';
	const maxUpdated = goals.reduce(
		(max, g) => (g.updatedAt > max ? g.updatedAt : max),
		goals[0].updatedAt
	);
	const timestamp = maxUpdated instanceof Date ? maxUpdated.getTime() : maxUpdated;
	return `"${userId.slice(0, 8)}-${goals.length}-${timestamp}"`;
}

// GET /api/goals - List all goals for authenticated user with habits
const CACHE_CONTROL_PRIVATE = 'private, max-age=60, stale-while-revalidate=30';

export const GET: RequestHandler = async (event) => {
	const { locals, platform, setHeaders, url, request } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');
	const activeOnly = url.searchParams.get('active') === 'true';
	const ifNoneMatch = request.headers.get('If-None-Match');

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
		const parsedHabits = habits.map(parseHabitFromDB);

		const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

		const etag = generateGoalsETag(goals, userId);
		if (ifNoneMatch === etag) {
			return new Response(null, { status: 304 });
		}

		setHeaders({
			'Cache-Control': CACHE_CONTROL_PRIVATE,
			ETag: etag
		});

		return json(paginatedResponse(goalsWithProgress, total, pagination));
	}

	// Non-paginated response
	const goals = await db
		.select()
		.from(goal)
		.where(and(...conditions));

	if (goals.length === 0) {
		const etag = '"empty"';
		if (ifNoneMatch === etag) {
			return new Response(null, { status: 304 });
		}
		setHeaders({
			'Cache-Control': CACHE_CONTROL_PRIVATE,
			ETag: etag
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
	const parsedHabits = habits.map(parseHabitFromDB);

	const goalsWithProgress = goals.map((g) => calculateGoalProgress(g, parsedHabits, completions));

	const etag = generateGoalsETag(goals, userId);
	if (ifNoneMatch === etag) {
		return new Response(null, { status: 304 });
	}

	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
		ETag: etag
	});

	return json(goalsWithProgress);
};

// POST /api/goals - Create new goal
export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

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

	// D1 reference for batch operations (requireDB already validated it exists)
	const d1 = platform!.env.DB;

	// Create goal
	const goalId = crypto.randomUUID();
	const now = new Date();
	const nowTimestamp = now.getTime();

	const goalData: Goal = {
		id: goalId,
		userId,
		title: data.title,
		description: data.description || null,
		color: data.color || null,
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
					`INSERT INTO goal (id, userId, title, description, color, startDate, endDate, createdAt, updatedAt)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					goalId,
					userId,
					data.title,
					data.description || null,
					data.color || null,
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

	const parsedHabits = attachedHabits.map(parseHabitFromDB);

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
