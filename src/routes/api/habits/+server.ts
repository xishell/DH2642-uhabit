import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { habit } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
	requireAuth,
	requireDB,
	parsePagination,
	paginatedResponse,
	enforceApiRateLimit,
	parseHabitFromDB,
	type DB
} from '$lib/server/api-helpers';

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

const generateETag = (userId: string, habits: (typeof habit.$inferSelect)[]) => {
	if (habits.length === 0) return '"empty"';
	const maxUpdated = habits.reduce(
		(max, h) => (h.updatedAt > max ? h.updatedAt : max),
		habits[0].updatedAt
	);
	const timestamp = maxUpdated instanceof Date ? maxUpdated.getTime() : maxUpdated;
	return `"${userId.slice(0, 8)}-${habits.length}-${timestamp}"`;
};

const sendCachedIfMatch = (
	request: Request,
	setHeaders: (headers: Record<string, string>) => void,
	userId: string,
	habits: (typeof habit.$inferSelect)[]
) => {
	const etag = generateETag(userId, habits);
	const ifNoneMatch = request.headers.get('If-None-Match');
	if (ifNoneMatch === etag) {
		return new Response(null, { status: 304 });
	}
	setHeaders({
		'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
		ETag: etag
	});
	return etag;
};

const listHabitsPaginated = async (
	db: DB,
	userId: string,
	url: URL,
	request: Request,
	setHeaders: (headers: Record<string, string>) => void
) => {
	const pagination = parsePagination(url);
	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(habit)
		.where(eq(habit.userId, userId));
	const total = Number(countResult?.count ?? 0);

	const habitsResult = await db
		.select()
		.from(habit)
		.where(eq(habit.userId, userId))
		.limit(pagination.limit)
		.offset(pagination.offset);

	const etag = sendCachedIfMatch(request, setHeaders, userId, habitsResult);
	if (!etag) return null;

	return json(paginatedResponse(habitsResult.map(parseHabitFromDB), total, pagination));
};

const listHabitsFull = async (
	db: DB,
	userId: string,
	request: Request,
	setHeaders: (headers: Record<string, string>) => void
) => {
	const habitsResult = await db.select().from(habit).where(eq(habit.userId, userId));
	const etag = sendCachedIfMatch(request, setHeaders, userId, habitsResult);
	if (!etag) return null;
	return json(habitsResult.map(parseHabitFromDB));
};

const parseHabitRequest = async (request: Request) => {
	const body = await request.json();
	const validationResult = createHabitSchema.safeParse(body);

	if (!validationResult.success) {
		throw error(
			400,
			'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
		);
	}

	return validationResult.data;
};

const buildHabitRecord = (data: z.infer<typeof createHabitSchema>, userId: string) => {
	const serializedPeriod = data.period ? JSON.stringify(data.period) : null;
	const habitId = crypto.randomUUID();
	const now = new Date();
	return {
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
};

// GET /api/habits - List all habits for authenticated user
export const GET: RequestHandler = async (event) => {
	const { locals, platform, setHeaders, url, request } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');
	const response = usePagination
		? await listHabitsPaginated(db, userId, url, request, setHeaders)
		: await listHabitsFull(db, userId, request, setHeaders);

	return response ?? new Response(null, { status: 304 });
};

// POST /api/habits - Create new habit
export const POST: RequestHandler = async (event) => {
	const { request, locals, platform } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	const data = await parseHabitRequest(request);
	const habitData = buildHabitRecord(data, userId);

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
