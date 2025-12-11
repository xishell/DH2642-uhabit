import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { goal, habit } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '$lib/server/api-helpers';

// Validation schema for attaching habits
const attachHabitsSchema = z.object({
	habitIds: z.array(z.string().uuid()).min(1, 'At least one habit ID is required')
});

/**
 * Verifies that a goal exists and belongs to the authenticated user.
 */
async function verifyGoalOwnership(db: ReturnType<typeof getDB>, goalId: string, userId: string) {
	const goals = await db
		.select()
		.from(goal)
		.where(and(eq(goal.id, goalId), eq(goal.userId, userId)))
		.limit(1);

	if (goals.length === 0) {
		throw error(404, 'Goal not found');
	}

	return goals[0];
}

// GET /api/goals/[id]/habits - Get habits attached to a goal
export const GET: RequestHandler = async ({ params, locals, platform, setHeaders }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify goal ownership
	await verifyGoalOwnership(db, params.id, userId);

	// Cache privately
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	// Fetch habits attached to this goal
	const habits = await db.select().from(habit).where(eq(habit.goalId, params.id));

	// Parse habit periods
	const parsedHabits = habits.map((h) => ({
		...h,
		period: h.period ? JSON.parse(h.period) : null
	}));

	return json(parsedHabits);
};

// POST /api/goals/[id]/habits - Attach habits to a goal
export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify goal ownership
	await verifyGoalOwnership(db, params.id, userId);

	// Parse and validate request body
	const body = await request.json();
	const validationResult = attachHabitsSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const { habitIds } = validationResult.data;

	// Verify all habits belong to the user
	const userHabits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(habitIds, sql`, `)})`));

	if (userHabits.length !== habitIds.length) {
		throw error(400, 'One or more habits not found or do not belong to you');
	}

	// Attach habits to goal
	const now = new Date();
	await db
		.update(habit)
		.set({ goalId: params.id, updatedAt: now })
		.where(and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(habitIds, sql`, `)})`));

	// Fetch updated habits
	const updatedHabits = await db.select().from(habit).where(eq(habit.goalId, params.id));

	const parsedHabits = updatedHabits.map((h) => ({
		...h,
		period: h.period ? JSON.parse(h.period) : null
	}));

	return json(parsedHabits, { status: 200 });
};

// DELETE /api/goals/[id]/habits - Detach a habit from a goal
// Use query param: ?habitId=xxx
export const DELETE: RequestHandler = async ({ params, url, locals, platform }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify goal ownership
	await verifyGoalOwnership(db, params.id, userId);

	const habitId = url.searchParams.get('habitId');
	if (!habitId) {
		throw error(400, 'habitId query parameter is required');
	}

	// Verify habit exists and belongs to user
	const [habitRecord] = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, habitId), eq(habit.userId, userId)))
		.limit(1);

	if (!habitRecord) {
		throw error(404, 'Habit not found');
	}

	if (habitRecord.goalId !== params.id) {
		throw error(400, 'Habit is not attached to this goal');
	}

	// Detach habit from goal
	await db.update(habit).set({ goalId: null, updatedAt: new Date() }).where(eq(habit.id, habitId));

	return new Response(null, { status: 204 });
};
