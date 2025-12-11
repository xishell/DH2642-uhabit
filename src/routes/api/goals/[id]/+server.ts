import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { goal, habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '$lib/server/api-helpers';
import { calculateGoalProgress } from '$lib/utils/goal';
import type { Habit } from '$lib/types/habit';

// Helper to parse habit from database (handles JSON period and type casting)
function parseHabit(h: typeof habit.$inferSelect): Habit {
	return {
		...h,
		frequency: h.frequency as Habit['frequency'],
		measurement: h.measurement as Habit['measurement'],
		period: h.period ? JSON.parse(h.period) : null
	};
}

// Validation schema for goal update
const updateGoalSchema = z
	.object({
		title: z.string().min(1).max(255).optional(),
		description: z.string().nullish(),
		startDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD')
			.optional(),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
			.optional()
	})
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return new Date(data.endDate) > new Date(data.startDate);
			}
			return true;
		},
		{ message: 'End date must be after start date', path: ['endDate'] }
	);

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

// GET /api/goals/[id] - Get single goal with habits and progress
export const GET: RequestHandler = async ({ params, locals, platform, setHeaders }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	const goalRecord = await verifyGoalOwnership(db, params.id, userId);

	// Cache privately
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	// Fetch attached habits
	const habits = await db.select().from(habit).where(eq(habit.goalId, params.id));

	// Fetch completions for progress calculation
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.userId, userId));

	// Parse habits
	const parsedHabits = habits.map(parseHabit);

	const goalWithProgress = calculateGoalProgress(goalRecord, parsedHabits, completions);

	return json(goalWithProgress);
};

// PATCH /api/goals/[id] - Update goal
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify ownership
	const existingGoal = await verifyGoalOwnership(db, params.id, userId);

	// Parse and validate request body
	const body = await request.json();
	const validationResult = updateGoalSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	// Build update object
	const updates: Partial<typeof goal.$inferInsert> = {
		updatedAt: new Date()
	};

	if (data.title !== undefined) {
		updates.title = data.title;
	}

	if (data.description !== undefined) {
		updates.description = data.description;
	}

	if (data.startDate !== undefined) {
		updates.startDate = new Date(data.startDate + 'T00:00:00Z');
	}

	if (data.endDate !== undefined) {
		updates.endDate = new Date(data.endDate + 'T23:59:59Z');
	}

	// Validate date range if only one date is being updated
	if (data.startDate && !data.endDate) {
		const newStart = new Date(data.startDate + 'T00:00:00Z');
		if (newStart >= existingGoal.endDate) {
			throw error(400, 'Start date must be before end date');
		}
	}

	if (data.endDate && !data.startDate) {
		const newEnd = new Date(data.endDate + 'T23:59:59Z');
		if (newEnd <= existingGoal.startDate) {
			throw error(400, 'End date must be after start date');
		}
	}

	await db.update(goal).set(updates).where(eq(goal.id, params.id));

	// Fetch updated goal with habits
	const [updatedGoal] = await db.select().from(goal).where(eq(goal.id, params.id));

	const habits = await db.select().from(habit).where(eq(habit.goalId, params.id));

	const completions = await db
		.select()
		.from(habitCompletion)
		.where(eq(habitCompletion.userId, userId));

	const parsedHabits = habits.map(parseHabit);

	const goalWithProgress = calculateGoalProgress(updatedGoal, parsedHabits, completions);

	return json(goalWithProgress);
};

// DELETE /api/goals/[id] - Delete goal (habits become standalone)
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify ownership
	await verifyGoalOwnership(db, params.id, userId);

	// Delete goal (habits will have goalId set to null due to ON DELETE SET NULL)
	await db.delete(goal).where(eq(goal.id, params.id));

	return new Response(null, { status: 204 });
};
