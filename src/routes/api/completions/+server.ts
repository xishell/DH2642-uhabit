import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { startOfDay, endOfDay, formatDate } from '$lib/utils/date';

// GET /api/completions - Get all completions for user with optional date filter
export const GET: RequestHandler = async ({ url, locals, platform, setHeaders }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Parse optional date query parameter
	const dateParam = url.searchParams.get('date');
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');

	// Validate date format if provided
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

	if (dateParam && !dateRegex.test(dateParam)) {
		throw error(400, 'Invalid "date" format. Use YYYY-MM-DD');
	}

	if (fromParam && !dateRegex.test(fromParam)) {
		throw error(400, 'Invalid "from" date format. Use YYYY-MM-DD');
	}

	if (toParam && !dateRegex.test(toParam)) {
		throw error(400, 'Invalid "to" date format. Use YYYY-MM-DD');
	}

	// Build query conditions
	const conditions = [eq(habitCompletion.userId, userId)];

	// If specific date provided, use it for both from and to
	if (dateParam) {
		const targetDate = new Date(dateParam + 'T00:00:00Z');
		conditions.push(gte(habitCompletion.completedAt, startOfDay(targetDate)));
		conditions.push(lte(habitCompletion.completedAt, endOfDay(targetDate)));
	} else {
		// Otherwise use from/to range if provided
		if (fromParam) {
			const fromDate = startOfDay(new Date(fromParam + 'T00:00:00Z'));
			conditions.push(gte(habitCompletion.completedAt, fromDate));
		}

		if (toParam) {
			const toDate = endOfDay(new Date(toParam + 'T00:00:00Z'));
			conditions.push(lte(habitCompletion.completedAt, toDate));
		}
	}

	// Fetch completions
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(and(...conditions))
		.orderBy(desc(habitCompletion.completedAt));

	// Cache privately for short duration since completions change frequently
	setHeaders({
		'Cache-Control': 'private, max-age=30, stale-while-revalidate=15'
	});

	return json(completions);
};
