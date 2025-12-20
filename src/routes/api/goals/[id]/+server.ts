import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { goal, habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import {
	requireAuth,
	requireDB,
	enforceApiRateLimit,
	parseHabitFromDB,
	type DB
} from '$lib/server/api-helpers';
import { calculateGoalProgress } from '$lib/utils/goal';
import { startOfDay, endOfDay } from '$lib/utils/date';

// Validation schema for goal update
const updateGoalSchema = z
	.object({
		title: z.string().min(1).max(255).optional(),
		description: z.string().nullish(),
		color: z.string().nullish(),
		startDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD')
			.optional(),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
			.optional(),
		habitIds: z.array(z.string()).optional()
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
async function verifyGoalOwnership(db: DB, goalId: string, userId: string) {
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

const fetchGoalWithProgress = async (
	db: DB,
	userId: string,
	goalId: string,
	setHeaders?: (headers: Record<string, string>) => void
) => {
	const goalRecord = await verifyGoalOwnership(db, goalId, userId);

	setHeaders?.({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	const habitsForGoal = await db.select().from(habit).where(eq(habit.goalId, goalId));
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(
			and(
				eq(habitCompletion.userId, userId),
				gte(habitCompletion.completedAt, startOfDay(goalRecord.startDate)),
				lte(habitCompletion.completedAt, endOfDay(goalRecord.endDate))
			)
		);

	const parsedHabits = habitsForGoal.map(parseHabitFromDB);
	return calculateGoalProgress(goalRecord, parsedHabits, completions);
};

// GET /api/goals/[id]: goal with habits and progress
export const GET: RequestHandler = async (event) => {
	const { params, locals, platform, setHeaders } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const goalWithProgress = await fetchGoalWithProgress(db, userId, params.id, setHeaders);
	return json(goalWithProgress);
};

// PATCH /api/goals/[id]: update goal
const parseGoalUpdate = async (request: Request) => {
	const body = await request.json();
	const validationResult = updateGoalSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	return validationResult.data;
};

const validateDateRangeUpdate = (
	data: z.infer<typeof updateGoalSchema>,
	existingGoal: typeof goal.$inferSelect
) => {
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
};

const buildGoalUpdates = (data: z.infer<typeof updateGoalSchema>) => {
	const updates: Partial<typeof goal.$inferInsert> = { updatedAt: new Date() };
	if (data.title !== undefined) updates.title = data.title;
	if (data.description !== undefined) updates.description = data.description;
	if (data.color !== undefined) updates.color = data.color;
	if (data.startDate !== undefined) updates.startDate = new Date(data.startDate + 'T00:00:00Z');
	if (data.endDate !== undefined) updates.endDate = new Date(data.endDate + 'T23:59:59Z');
	return updates;
};

const updateHabitAttachments = async (
	db: DB,
	userId: string,
	goalId: string,
	habitIds: string[] | undefined
) => {
	if (habitIds === undefined) return;
	const now = new Date();
	const baseDetachCondition = and(eq(habit.userId, userId), eq(habit.goalId, goalId));

	if (habitIds.length === 0) {
		await db.update(habit).set({ goalId: null, updatedAt: now }).where(baseDetachCondition);
		return;
	}

	const ownedHabits = await db
		.select({ id: habit.id })
		.from(habit)
		.where(and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(habitIds, sql`, `)})`));

	const ownedIds = new Set(ownedHabits.map((h) => h.id));
	const invalid = habitIds.filter((id) => !ownedIds.has(id));
	if (invalid.length > 0) {
		throw error(400, 'One or more habits are invalid or do not belong to the user.');
	}

	await db
		.update(habit)
		.set({ goalId: null, updatedAt: now })
		.where(and(baseDetachCondition, sql`${habit.id} NOT IN (${sql.join(habitIds, sql`, `)})`));

	await db
		.update(habit)
		.set({ goalId, updatedAt: now })
		.where(and(eq(habit.userId, userId), sql`${habit.id} IN (${sql.join(habitIds, sql`, `)})`));
};

// PATCH /api/goals/[id]: update goal
export const PATCH: RequestHandler = async (event) => {
	const { params, request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const existingGoal = await verifyGoalOwnership(db, params.id, userId);
	const data = await parseGoalUpdate(request);

	validateDateRangeUpdate(data, existingGoal);
	const updates = buildGoalUpdates(data);
	await db.update(goal).set(updates).where(eq(goal.id, params.id));

	await updateHabitAttachments(db, userId, params.id, data.habitIds);

	// Fetch updated goal with habits
	const goalWithProgress = await fetchGoalWithProgress(db, userId, params.id);
	return json(goalWithProgress);
};

// DELETE /api/goals/[id]: delete goal (habits become standalone)
export const DELETE: RequestHandler = async (event) => {
	const { params, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	// Verify ownership
	await verifyGoalOwnership(db, params.id, userId);

	// Delete goal; ON DELETE SET NULL clears goalId on habits
	await db.delete(goal).where(eq(goal.id, params.id));

	return new Response(null, { status: 204 });
};
