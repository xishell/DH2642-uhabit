import type { NagerHoliday, Holiday } from '$lib/types/holiday';

const NAGER_DATE_BASE_URL = 'https://date.nager.at/api/v3';

/**
 * Fetch public holidays from Nager.Date API
 *
 * @param year - The year to fetch holidays for
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE', 'SE')
 * @returns Array of holidays for the given year and country
 * @throws Error if the API request fails
 */
export async function fetchHolidaysFromNager(
	year: number,
	countryCode: string
): Promise<Holiday[]> {
	const url = `${NAGER_DATE_BASE_URL}/PublicHolidays/${year}/${countryCode.toUpperCase()}`;

	const response = await fetch(url, {
		headers: {
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		if (response.status === 404) {
			// Country not supported or no holidays found
			return [];
		}
		throw new Error(`Failed to fetch holidays: ${response.status} ${response.statusText}`);
	}

	const data: NagerHoliday[] = await response.json();

	// Transform to simplified Holiday type
	return data.map((h) => ({
		date: h.date,
		name: h.name,
		localName: h.localName,
		isPublic: h.types.includes('Public')
	}));
}

/**
 * Get holidays for a specific date range
 *
 * @param holidays - Array of holidays to filter
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns Holidays within the date range
 */
export function filterHolidaysByDateRange(
	holidays: Holiday[],
	startDate: string,
	endDate: string
): Holiday[] {
	return holidays.filter((h) => h.date >= startDate && h.date <= endDate);
}

/**
 * Check if a specific date is a holiday
 *
 * @param holidays - Array of holidays to check against
 * @param date - Date string in YYYY-MM-DD format
 * @returns The holiday if found, undefined otherwise
 */
export function findHolidayOnDate(holidays: Holiday[], date: string): Holiday | undefined {
	return holidays.find((h) => h.date === date);
}
