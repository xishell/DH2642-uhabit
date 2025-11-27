import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for habit creation
const createHabitSchema = z.object({
	title: z.string().min(1).max(255),
	notes: z.string().optional(),
	color: z.string().optional(),
	frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
	measurement: z.enum(['boolean', 'numeric']).default('boolean'),
	period: z.string().optional()
});

// GET /api/habits - List all habits for authenticated user
export const GET: RequestHandler = async ({ locals, platform }) => {
	// Check authentication
	// TODO: Re-enable auth after implementing login UI
	// if (!locals.user) {
	// 	throw error(401, 'Unauthorized');
	// }

	// TEMP: Use mock user for testing
	const userId = locals.user?.id || 'test-user-123';

	const db = getDB(platform!.env.DB);

	// Fetch all habits for the current user
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));

	return json(habits);
};

// POST /api/habits - Create new habit
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Check authentication
	// TODO: Re-enable auth after implementing login UI
	// if (!locals.user) {
	// 	throw error(401, 'Unauthorized');
	// }

	// TEMP: Use mock user for testing
	const userId = locals.user?.id || 'test-user-123';

	// Parse and validate request body
	const body = await request.json();
	const validationResult = createHabitSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	const data = validationResult.data;

	// Debug: Check if DB is available
	if (!platform?.env?.DB) {
		console.error('DB not available in platform.env');
		throw error(500, 'Database not configured');
	}

	const db = getDB(platform.env.DB);

	// Create habit
	const habitId = crypto.randomUUID();
	const now = new Date();

	try {
		await db.insert(habit).values({
			id: habitId,
			userId,
			title: data.title,
			notes: data.notes || null,
			color: data.color || null,
			frequency: data.frequency,
			measurement: data.measurement,
			period: data.period || null,
			createdAt: now,
			updatedAt: now
		});
	} catch (err) {
		console.error('Insert error:', err);
		console.error('Error details:', JSON.stringify(err, null, 2));
		throw error(500, 'Failed to create habit: ' + (err as Error).message);
	}

	// Fetch the created habit
	const newHabit = await db.select().from(habit).where(eq(habit.id, habitId)).limit(1);

	return json(newHabit[0], { status: 201 });
};
