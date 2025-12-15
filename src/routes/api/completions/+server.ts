import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { startOfDay, endOfDay } from '$lib/utils/date';
import {
	requireAuth,
	parsePagination,
	paginatedResponse,
	parseDateRangeParams,
	enforceApiRateLimit
} from '$lib/server/api-helpers';

// GET /api/completions: user completions with optional date filter
// Supports pagination: ?page=1&limit=20
// Supports ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export const GET: RequestHandler = async (event) => {
	const { url, locals, platform, setHeaders } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = getDB(platform!.env.DB);

	// Check if pagination is requested
	const usePagination = url.searchParams.has('page') || url.searchParams.has('limit');

	// Parse and validate date parameters
	const { date: dateParam, from: fromParam, to: toParam } = parseDateRangeParams(url);

	// Build query conditions
	const conditions = [eq(habitCompletion.userId, userId)];

	const DAY_SUFFIX = 'T00:00:00Z';
	// If specific date provided, use it for both from and to
	if (dateParam) {
		const targetDate = new Date(dateParam + DAY_SUFFIX);
		conditions.push(gte(habitCompletion.completedAt, startOfDay(targetDate)));
		conditions.push(lte(habitCompletion.completedAt, endOfDay(targetDate)));
	} else {
		// Otherwise use from/to range if provided
		if (fromParam) {
			const fromDate = startOfDay(new Date(fromParam + DAY_SUFFIX));
			conditions.push(gte(habitCompletion.completedAt, fromDate));
		}

		if (toParam) {
			const toDate = endOfDay(new Date(toParam + DAY_SUFFIX));
			conditions.push(lte(habitCompletion.completedAt, toDate));
		}
	}

	// Short private cache; completions change often
	setHeaders({
		'Cache-Control': 'private, max-age=30, stale-while-revalidate=15'
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
