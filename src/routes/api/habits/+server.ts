import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, parsePagination, paginatedResponse } from '$lib/server/api-helpers';

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
		unit: z
			.string()
			.nullish()
			.transform((val) => val?.trim().toLowerCase() || null),
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
// Supports optional pagination: ?page=1&limit=20
// Without pagination params, returns all habits (backward compatible)
export const GET: RequestHandler = async ({ locals, platform, setHeaders, url }) => {
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Check if pagination is requested
	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');

	// Helper to parse habit period JSON
	const parseHabit = (h: typeof habit.$inferSelect) => ({
		...h,
		period: h.period ? JSON.parse(h.period) : null
	});

	// Cache privately to cut repeated reads while keeping data user-specific
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60'
	});

	if (usePagination) {
		const pagination = parsePagination(url);

		// Get total count
		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(habit)
			.where(eq(habit.userId, userId));
		const total = Number(countResult?.count ?? 0);

		// Fetch paginated habits
		const habits = await db
			.select()
			.from(habit)
			.where(eq(habit.userId, userId))
			.limit(pagination.limit)
			.offset(pagination.offset);

		return json(paginatedResponse(habits.map(parseHabit), total, pagination));
	}

	// Non-paginated response (backward compatible)
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));
	return json(habits.map(parseHabit));
};

// POST /api/habits - Create new habit
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const userId = requireAuth(locals);

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

	const habitData = {
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
	};

	try {
		await db.insert(habit).values(habitData);
	} catch (err) {
		console.error('Insert error:', err);
		console.error('Error details:', JSON.stringify(err, null, 2));
		throw error(500, 'Failed to create habit: ' + (err as Error).message);
	}

	// Return the created habit data without an extra SELECT query
	return json(
		{
			...habitData,
			period: data.period || null
		},
		{ status: 201 }
	);
};
