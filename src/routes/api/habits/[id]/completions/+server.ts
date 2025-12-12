import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { startOfDay, endOfDay } from '$lib/utils/date';
import {
	requireAuth,
	verifyHabitOwnership,
	parsePagination,
	paginatedResponse,
	validateDateParam,
	enforceApiRateLimit
} from '$lib/server/api-helpers';

// GET /api/habits/[id]/completions: history (optional date range)
// Supports pagination ?page=1&limit=20
// Supports ?from=YYYY-MM-DD&to=YYYY-MM-DD
export const GET: RequestHandler = async (event) => {
	const { params, url, locals, platform, setHeaders } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Verify habit exists and belongs to user
	await verifyHabitOwnership(db, params.id, userId);

	// Check if pagination is requested
	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');

	// Parse and validate date range parameters
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');
	validateDateParam(fromParam, 'from');
	validateDateParam(toParam, 'to');

	// Build query conditions
	const conditions = [eq(habitCompletion.habitId, params.id)];

	if (fromParam) {
		const fromDate = startOfDay(new Date(fromParam + 'T00:00:00Z'));
		conditions.push(gte(habitCompletion.completedAt, fromDate));
	}

	if (toParam) {
		const toDate = endOfDay(new Date(toParam + 'T00:00:00Z'));
		conditions.push(lte(habitCompletion.completedAt, toDate));
	}

	// Short private cache; completions change quickly
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	if (usePagination) {
		const pagination = parsePagination(url);

		// Get total count with filters
		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(habitCompletion)
			.where(and(...conditions));
		const total = Number(countResult?.count ?? 0);

		// Fetch paginated completions
		const completions = await db
			.select()
			.from(habitCompletion)
			.where(and(...conditions))
			.orderBy(desc(habitCompletion.completedAt))
			.limit(pagination.limit)
			.offset(pagination.offset);

		return json(paginatedResponse(completions, total, pagination));
	}

	// Non-paginated response (backward compatible)
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(and(...conditions))
		.orderBy(desc(habitCompletion.completedAt));

	return json(completions);
};
