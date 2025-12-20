import { eq, isNotNull } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { user, habit, notification } from '$lib/server/db/schema';
import { getHolidaysForCurrentPeriod } from '$lib/server/holidays/holidayCache';
import { filterHolidaysByDateRange } from '$lib/server/holidays/nagerDateClient';
import type { HolidayConflict } from '$lib/types/holiday';
import type { Notification, HolidayRescheduleMetadata } from '$lib/types/notification';
import { sendWakeUpPush, getPushConfig } from '$lib/server/push';
import type { NotificationOptions } from './checkStreakMilestone';

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

/** Calculate a suggested reschedule date (2 days before the holiday) */
function getSuggestedDate(holidayDate: string): string {
	const date = new Date(holidayDate);
	date.setDate(date.getDate() - 2);
	return date.toISOString().split('T')[0];
}

type HabitRecord = { id: string; title: string; frequency: string; period: string | null };

/** Find conflicts between habits and public holidays */
function findConflicts(
	habits: HabitRecord[],
	holidays: { date: string; name: string; isPublic?: boolean }[]
): HolidayConflict[] {
	return holidays
		.filter((h) => h.isPublic)
		.map((holiday) => {
			const conflicting = habits.filter((h) => isHabitScheduledOnDate(h, holiday.date));
			if (conflicting.length === 0) return null;
			return {
				holiday,
				habits: conflicting.map((h) => ({ id: h.id, title: h.title })),
				suggestedDate: getSuggestedDate(holiday.date)
			};
		})
		.filter((c): c is HolidayConflict => c !== null);
}

/** Create a notification for a holiday conflict */
function createConflictNotification(userId: string, conflict: HolidayConflict, now: Date) {
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
	return {
		data: {
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
			expiresAt: new Date(conflict.holiday.date)
		},
		metadata
	};
}

/** Send push notification if configured */
async function sendPushIfConfigured(
	db: DB,
	userId: string,
	options?: NotificationOptions
): Promise<void> {
	if (!options?.env) return;
	const pushConfig = getPushConfig(options.env);
	if (!pushConfig) return;
	const pushPromise = sendWakeUpPush(db, userId, pushConfig).catch((err) => {
		console.error('[Push] Failed to send holiday conflict push:', err);
	});
	if (options.waitUntil) options.waitUntil(pushPromise);
	else await pushPromise;
}

/**
 * Check for holiday conflicts for a single user
 */
export async function checkHolidayConflictsForUser(
	db: DB,
	userId: string,
	daysAhead = 7,
	options?: NotificationOptions
): Promise<Notification[]> {
	const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);
	if (users.length === 0 || !users[0].country) return [];

	const endDate = new Date();
	endDate.setDate(endDate.getDate() + daysAhead);
	const today = new Date().toISOString().split('T')[0];
	const endDateStr = endDate.toISOString().split('T')[0];
	const includeNextYear = endDate.getFullYear() > new Date().getFullYear();

	const allHolidays = await getHolidaysForCurrentPeriod(db, users[0].country, includeNextYear);
	const upcomingHolidays = filterHolidaysByDateRange(allHolidays, today, endDateStr);
	if (upcomingHolidays.length === 0) return [];

	const habits = await db.select().from(habit).where(eq(habit.userId, userId));
	if (habits.length === 0) return [];

	const conflicts = findConflicts(habits, upcomingHolidays);
	if (conflicts.length === 0) return [];

	const now = new Date();
	const notifications: Notification[] = [];
	for (const conflict of conflicts) {
		const { data, metadata } = createConflictNotification(userId, conflict, now);
		await db.insert(notification).values(data);
		notifications.push({ ...data, metadata });
	}

	await sendPushIfConfigured(db, userId, options);
	return notifications;
}

/**
 * Check holiday conflicts for all users with a country set
 * Meant to be called by a cron job
 *
 * @param db - Database instance
 * @param options - Optional push notification config
 * @returns Number of notifications created
 */
export async function checkHolidayConflictsForAllUsers(
	db: DB,
	options?: NotificationOptions
): Promise<number> {
	// Get all users with a country set
	const usersWithCountry = await db
		.select({ id: user.id })
		.from(user)
		.where(isNotNull(user.country));

	let notificationCount = 0;

	for (const u of usersWithCountry) {
		const notifications = await checkHolidayConflictsForUser(db, u.id, 7, options);
		notificationCount += notifications.length;
	}

	return notificationCount;
}
