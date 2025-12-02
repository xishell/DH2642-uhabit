/**
 * Date utility functions for habit tracking
 */

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

/**
 * Get the start of day (midnight) for a given date
 */
export function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the end of day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Calculate streak days between two dates
 */
export function getDaysBetween(start: Date, end: Date): number {
	const startDay = startOfDay(start);
	const endDay = startOfDay(end);
	const diffMs = endDay.getTime() - startDay.getTime();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get the month name for a given date (defaults to current date)
 */
export function getMonthName(date: Date = new Date()): string {
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return monthNames[date.getMonth()];
}
