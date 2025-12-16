import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { requireAuth, requireDB, enforceApiRateLimit } from '$lib/server/api-helpers';
import { user } from '$lib/server/db/schema';
import { getHolidaysForCurrentPeriod } from '$lib/server/holidays/holidayCache';
import { filterHolidaysByDateRange } from '$lib/server/holidays/nagerDateClient';
import { isValidCountryCode } from '$lib/types/holiday';

/**
 * GET /api/holidays
 * Get holidays for the authenticated user's country
 * Query params:
 *   - from: Start date (YYYY-MM-DD), defaults to today
 *   - to: End date (YYYY-MM-DD), defaults to 30 days from today
 *   - country: Override user's country (optional)
 */
export const GET: RequestHandler = async (event) => {
	const { locals, platform, url } = event;
	await enforceApiRateLimit(event);
	const userId = requireAuth(locals);
	const db = requireDB(platform);

	// Get user's country
	const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (users.length === 0) {
		throw error(404, 'User not found');
	}

	// Use query param country or fall back to user's country
	const countryParam = url.searchParams.get('country');
	const countryCode = countryParam || users[0].country;

	if (!countryCode) {
		throw error(400, 'No country set. Please set your country in profile settings.');
	}

	if (!isValidCountryCode(countryCode)) {
		throw error(400, `Country code "${countryCode}" is not supported`);
	}

	// Parse date range
	const today = new Date();
	const defaultFrom = today.toISOString().split('T')[0];
	const defaultTo = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

	const from = url.searchParams.get('from') || defaultFrom;
	const to = url.searchParams.get('to') || defaultTo;

	// Check if we need next year's holidays
	const toYear = parseInt(to.split('-')[0], 10);
	const currentYear = today.getFullYear();
	const includeNextYear = toYear > currentYear;

	// Get holidays with caching
	const allHolidays = await getHolidaysForCurrentPeriod(db, countryCode, includeNextYear);

	// Filter to requested date range
	const holidays = filterHolidaysByDateRange(allHolidays, from, to);

	return json({
		countryCode,
		from,
		to,
		holidays
	});
};
