import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { habit, habitCompletion } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { startOfDay, endOfDay } from '$lib/utils/date';

// GET /api/habits/[id]/completions - Get completion history with optional date range
export const GET: RequestHandler = async ({ params, url, locals, platform, setHeaders }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	const db = getDB(platform!.env.DB);

	// Verify habit exists and belongs to user
	const habits = await db
		.select()
		.from(habit)
		.where(and(eq(habit.id, params.id), eq(habit.userId, userId)))
		.limit(1);

	if (habits.length === 0) {
		throw error(404, 'Habit not found');
	}

	// Parse optional date range query parameters
	const fromParam = url.searchParams.get('from');
	const toParam = url.searchParams.get('to');

	// Validate date format if provided
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

	if (fromParam && !dateRegex.test(fromParam)) {
		throw error(400, 'Invalid "from" date format. Use YYYY-MM-DD');
	}

	if (toParam && !dateRegex.test(toParam)) {
		throw error(400, 'Invalid "to" date format. Use YYYY-MM-DD');
	}

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

	// Fetch completions with date range filter
	const completions = await db
		.select()
		.from(habitCompletion)
		.where(and(...conditions))
		.orderBy(desc(habitCompletion.completedAt));

	// Cache privately for shorter duration since completions change more frequently
	setHeaders({
		'Cache-Control': 'private, max-age=60, stale-while-revalidate=30'
	});

	return json(completions);
};
