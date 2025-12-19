import { eq, and } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { holidayCache } from '$lib/server/db/schema';
import type { Holiday } from '$lib/types/holiday';
import { fetchHolidaysFromNager } from './nagerDateClient';

/** Cache duration in days */
const CACHE_DURATION_DAYS = 30;

/**
 * Generate cache ID from country code and year
 */
function getCacheId(countryCode: string, year: number): string {
	return `${countryCode.toUpperCase()}-${year}`;
}

/**
 * Get holidays for a country and year, using cache if available
 *
 * @param db - Database instance
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param year - Year to fetch holidays for
 * @returns Array of holidays
 */
export async function getHolidaysWithCache(
	db: DB,
	countryCode: string,
	year: number
): Promise<Holiday[]> {
	const cacheId = getCacheId(countryCode, year);
	const now = new Date();

	// Try to get from cache
	const cached = await db
		.select()
		.from(holidayCache)
		.where(
			and(eq(holidayCache.id, cacheId), eq(holidayCache.countryCode, countryCode.toUpperCase()))
		)
		.limit(1);

	if (cached.length > 0) {
		const entry = cached[0];
		// Check if cache is still valid
		if (entry.expiresAt > now) {
			return JSON.parse(entry.holidays) as Holiday[];
		}
	}

	// Fetch from API
	let holidays: Holiday[];
	try {
		holidays = await fetchHolidaysFromNager(year, countryCode);
	} catch (error) {
		console.error(`Failed to fetch holidays for ${countryCode}/${year}:`, error);
		// If we have stale cache, return it as fallback
		if (cached.length > 0) {
			return JSON.parse(cached[0].holidays) as Holiday[];
		}
		return [];
	}

	// Calculate expiration (30 days from now)
	const expiresAt = new Date(now.getTime() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

	// Upsert cache entry
	if (cached.length > 0) {
		await db
			.update(holidayCache)
			.set({
				holidays: JSON.stringify(holidays),
				fetchedAt: now,
				expiresAt
			})
			.where(eq(holidayCache.id, cacheId));
	} else {
		await db.insert(holidayCache).values({
			id: cacheId,
			countryCode: countryCode.toUpperCase(),
			year,
			holidays: JSON.stringify(holidays),
			fetchedAt: now,
			expiresAt
		});
	}

	return holidays;
}

/**
 * Get holidays for the current year and optionally next year
 * (useful when checking dates near year end)
 *
 * @param db - Database instance
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param includeNextYear - Whether to include next year's holidays
 * @returns Combined array of holidays
 */
export async function getHolidaysForCurrentPeriod(
	db: DB,
	countryCode: string,
	includeNextYear = false
): Promise<Holiday[]> {
	const currentYear = new Date().getFullYear();
	const holidays = await getHolidaysWithCache(db, countryCode, currentYear);

	if (includeNextYear) {
		const nextYearHolidays = await getHolidaysWithCache(db, countryCode, currentYear + 1);
		return [...holidays, ...nextYearHolidays];
	}

	return holidays;
}

/**
 * Clear expired cache entries
 *
 * @param db - Database instance
 */
export async function cleanupExpiredCache(db: DB): Promise<void> {
	const now = new Date();
	await db.delete(holidayCache).where(eq(holidayCache.expiresAt, now));
}
