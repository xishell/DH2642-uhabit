import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for habit updates
const updateHabitSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	notes: z.string().nullish(),
	color: z.string().nullish(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
	measurement: z.enum(['boolean', 'numeric']).optional(),
	period: z.array(z.number().int()).nullish(),
	targetAmount: z.number().int().positive().nullish(),
	unit: z.string().nullish(),
	categoryId: z.string().uuid().nullish(),
	goalId: z.string().uuid().nullish()
});

// GET /api/habits/[id] - Get single habit by ID
export const GET: RequestHandler = async ({ params, locals, platform, setHeaders }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Fetch habit - ensure it belongs to the current user
	const habits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)))
		.limit(1);

	if (habits.length === 0) {
		throw error(404, 'Habit not found');
	}

	const [found] = habits;

	// Cache privately to reduce repeat DB hits for the same habit
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	return json({
		...found,
		period: found.period ? JSON.parse(found.period) : null
	});
};

// PATCH /api/habits/[id] - Update existing habit
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	// Parse and validate request body
	const body = await request.json();
	const validationResult = updateHabitSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;
	const db = getDB(platform!.env.DB);

	// Check if habit exists and belongs to user
	const existingHabits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)))
		.limit(1);

	if (existingHabits.length === 0) {
		throw error(404, 'Habit not found');
	}

	const existingHabit = existingHabits[0];
	const effectiveMeasurement = data.measurement ?? existingHabit.measurement;
	const effectiveTargetAmount = data.targetAmount ?? existingHabit.targetAmount;
	const effectiveUnit = data.unit ?? existingHabit.unit;

	if (
		effectiveMeasurement === 'numeric' &&
		(effectiveTargetAmount == null || effectiveUnit == null || effectiveUnit.trim() === '')
	) {
		throw error(400, 'Numeric habits require both targetAmount and unit');
	}

	const serializedPeriod = data.period ? JSON.stringify(data.period) : null;

	const updateData: Record<string, unknown> = { updatedAt: new Date() };
	if (data.title !== undefined) updateData.title = data.title;
	if (data.notes !== undefined) updateData.notes = data.notes;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.frequency !== undefined) updateData.frequency = data.frequency;
	if (data.measurement !== undefined) updateData.measurement = data.measurement;
	if (data.period !== undefined) updateData.period = serializedPeriod;
	if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount;
	if (data.unit !== undefined) updateData.unit = data.unit;
	if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
	if (data.goalId !== undefined) updateData.goalId = data.goalId;

	// Update habit
	await db
		.update(habit)
		.set({
			...updateData
		})
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)));

	// Fetch the updated habit
	const updatedHabit = await db.select().from(habit).where(eq(habit.id, params.id)).limit(1);

	const [found] = updatedHabit;

	return json({
		...found,
		period: found.period ? JSON.parse(found.period) : null
	});
};

// DELETE /api/habits/[id] - Delete habit
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Check if habit exists and belongs to user
	const existingHabits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)))
		.limit(1);

	if (existingHabits.length === 0) {
		throw error(404, 'Habit not found');
	}

	// Delete habit
	await db.delete(habit).where(and(eq(habit.id, params.id), eq(habit.userId, userId)));

	return new Response(null, { status: 204 });
};
