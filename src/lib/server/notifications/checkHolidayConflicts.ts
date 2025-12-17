import { eq, and, isNotNull } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { user, habit, notification } from '$lib/server/db/schema';
import { getHolidaysForCurrentPeriod } from '$lib/server/holidays/holidayCache';
import { filterHolidaysByDateRange, findHolidayOnDate } from '$lib/server/holidays/nagerDateClient';
import type { Holiday, HolidayConflict } from '$lib/types/holiday';
import type { Notification, HolidayRescheduleMetadata } from '$lib/types/notification';

/**
 * Get dates for the next N days
 */
function getNextDays(days: number): string[] {
	const dates: string[] = [];
	const today = new Date();

	for (let i = 1; i <= days; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() + i);
		dates.push(date.toISOString().split('T')[0]);
	}

	return dates;
}

/**
 * Check if a habit is scheduled on a specific date
 * Based on habit frequency and period settings
 */
function isHabitScheduledOnDate(
	habit: { frequency: string; period: string | null },
	dateStr: string
): boolean {
	const date = new Date(dateStr);
	const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
	const dayOfMonth = date.getDate();

	if (habit.frequency === 'daily') {
		// Daily habits with period = specific days of week
		if (habit.period) {
			const period = JSON.parse(habit.period) as number[];
			return period.includes(dayOfWeek);
		}
		// Daily without period = every day
		return true;
	}

	if (habit.frequency === 'weekly') {
		// Weekly habits with period = specific days
		if (habit.period) {
			const period = JSON.parse(habit.period) as number[];
			return period.includes(dayOfWeek);
		}
		return false;
	}

	if (habit.frequency === 'monthly') {
		// Monthly habits with period = specific days of month
		if (habit.period) {
			const period = JSON.parse(habit.period) as number[];
			return period.includes(dayOfMonth);
		}
		return false;
	}

	return false;
}

/**
 * Calculate a suggested reschedule date (2 days before the holiday)
 */
function getSuggestedDate(holidayDate: string): string {
	const date = new Date(holidayDate);
	date.setDate(date.getDate() - 2);
	return date.toISOString().split('T')[0];
}

/**
 * Check for holiday conflicts for a single user
 *
 * @param db - Database instance
 * @param userId - User ID to check
 * @param daysAhead - How many days ahead to check (default: 7)
 * @returns Array of created notifications for conflicts found
 */
export async function checkHolidayConflictsForUser(
	db: DB,
	userId: string,
	daysAhead = 7
): Promise<Notification[]> {
	// Get user's country
	const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (users.length === 0 || !users[0].country) {
		return [];
	}

	const countryCode = users[0].country;

	// Get holidays for the period
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + daysAhead);
	const includeNextYear = endDate.getFullYear() > new Date().getFullYear();

	const allHolidays = await getHolidaysForCurrentPeriod(db, countryCode, includeNextYear);

	const today = new Date().toISOString().split('T')[0];
	const endDateStr = endDate.toISOString().split('T')[0];
	const upcomingHolidays = filterHolidaysByDateRange(allHolidays, today, endDateStr);

	if (upcomingHolidays.length === 0) {
		return [];
	}

	// Get user's active habits
	const habits = await db.select().from(habit).where(eq(habit.userId, userId));

	if (habits.length === 0) {
		return [];
	}

	// Find conflicts
	const conflicts: HolidayConflict[] = [];

	for (const holiday of upcomingHolidays) {
		// Only check public holidays
		if (!holiday.isPublic) continue;

		const conflictingHabits = habits.filter((h) =>
			isHabitScheduledOnDate({ frequency: h.frequency, period: h.period }, holiday.date)
		);

		if (conflictingHabits.length > 0) {
			conflicts.push({
				holiday,
				habits: conflictingHabits.map((h) => ({ id: h.id, title: h.title })),
				suggestedDate: getSuggestedDate(holiday.date)
			});
		}
	}

	if (conflicts.length === 0) {
		return [];
	}

	// Create notifications for each conflict
	const notifications: Notification[] = [];
	const now = new Date();

	for (const conflict of conflicts) {
		const metadata: HolidayRescheduleMetadata = {
			kind: 'holiday_reschedule',
			holidayDate: conflict.holiday.date,
			holidayName: conflict.holiday.name,
			conflictingHabits: conflict.habits,
			suggestedDate: conflict.suggestedDate
		};

		const habitNames =
			conflict.habits.length === 1
				? `"${conflict.habits[0].title}"`
				: `${conflict.habits.length} habits`;

		const notificationData = {
			id: crypto.randomUUID(),
			userId,
			type: 'holiday_reschedule' as const,
			habitId: conflict.habits.length === 1 ? conflict.habits[0].id : null,
			goalId: null,
			title: `Holiday Coming: ${conflict.holiday.name}`,
			body: `${habitNames} scheduled on ${conflict.holiday.date}. Would you like to reschedule?`,
			metadata: JSON.stringify(metadata),
			read: false,
			dismissed: false,
			createdAt: now,
			expiresAt: new Date(conflict.holiday.date) // Expires on the holiday
		};

		await db.insert(notification).values(notificationData);

		notifications.push({
			...notificationData,
			metadata
		});
	}

	return notifications;
}

/**
 * Check holiday conflicts for all users with a country set
 * Meant to be called by a cron job
 */
export async function checkHolidayConflictsForAllUsers(db: DB): Promise<number> {
	// Get all users with a country set
	const usersWithCountry = await db
		.select({ id: user.id })
		.from(user)
		.where(isNotNull(user.country));

	let notificationCount = 0;

	for (const u of usersWithCountry) {
		const notifications = await checkHolidayConflictsForUser(db, u.id);
		notificationCount += notifications.length;
	}

	return notificationCount;
}
