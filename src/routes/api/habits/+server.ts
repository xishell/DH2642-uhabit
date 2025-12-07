import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for habit creation
const createHabitSchema = z
	.object({
		title: z.string().min(1).max(255),
		notes: z.string().nullish(),
		color: z.string().nullish(),
		frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
		measurement: z.enum(['boolean', 'numeric']).default('boolean'),
		period: z.array(z.number().int()).nullish(),
		targetAmount: z.number().int().positive().nullish(),
		unit: z.string().nullish(),
		categoryId: z.string().uuid().nullish(),
		goalId: z.string().uuid().nullish()
	})
	.refine(
		(data) => {
			// For numeric habits, require targetAmount and unit
			if (data.measurement === 'numeric') {
				return data.targetAmount != null && data.unit != null && data.unit.trim() !== '';
			}
			return true;
		},
		{
			message: 'Numeric habits require both targetAmount and unit',
			path: ['targetAmount']
		}
	);

// GET /api/habits - List all habits for authenticated user
export const GET: RequestHandler = async ({ locals, platform, setHeaders }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Fetch all habits for the current user
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));

	// Cache privately to cut repeated reads while keeping data user-specific
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	return json(
		habits.map((h) => ({
			...h,
			period: h.period ? JSON.parse(h.period) : null
		}))
	);
};

// POST /api/habits - Create new habit
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

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

	const serializedPeriod = data.period ? JSON.stringify(data.period) : null;

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
			period: serializedPeriod,
			targetAmount: data.targetAmount || null,
			unit: data.unit || null,
			categoryId: data.categoryId || null,
			goalId: data.goalId || null,
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

	return json(
		{
			...newHabit[0],
			period: newHabit[0].period ? JSON.parse(newHabit[0].period) : null
		},
		{ status: 201 }
	);
};
