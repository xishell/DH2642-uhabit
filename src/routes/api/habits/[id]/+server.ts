import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for habit updates
const updateHabitSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	notes: z.string().optional(),
	color: z.string().optional(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
	measurement: z.enum(['boolean', 'numeric']).optional(),
	period: z.string().optional()
});

// GET /api/habits/[id] - Get single habit by ID
export const GET: RequestHandler = async ({ params, locals, platform }) => {
	// Check authentication
	// TODO: Re-enable auth after implementing login UI
	// if (!locals.user) {
	// 	throw error(401, 'Unauthorized');
	// }

	// TEMP: Use mock user for testing
	const userId = locals.user?.id || 'test-user-123';

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

	return json(habits[0]);
};

// PATCH /api/habits/[id] - Update existing habit
export const PATCH: RequestHandler = async ({ params, request, locals, platform }) => {
	// Check authentication
	// TODO: Re-enable auth after implementing login UI
	// if (!locals.user) {
	// 	throw error(401, 'Unauthorized');
	// }

	// TEMP: Use mock user for testing
	const userId = locals.user?.id || 'test-user-123';

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

	// Update habit
	await db
		.update(habit)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(habit.id, params.id));

	// Fetch the updated habit
	const updatedHabit = await db.select().from(habit).where(eq(habit.id, params.id)).limit(1);

	return json(updatedHabit[0]);
};

// DELETE /api/habits/[id] - Delete habit
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Check authentication
	// TODO: Re-enable auth after implementing login UI
	// if (!locals.user) {
	// 	throw error(401, 'Unauthorized');
	// }

	// TEMP: Use mock user for testing
	const userId = locals.user?.id || 'test-user-123';

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
	await db.delete(habit).where(eq(habit.id, params.id));

	return new Response(null, { status: 204 });
};
