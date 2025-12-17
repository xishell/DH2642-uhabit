import { eq } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { habit, notification } from '$lib/server/db/schema';
import type { Notification, StreakMilestoneMetadata } from '$lib/types/notification';

/** Milestone streak values that trigger notifications */
const STREAK_MILESTONES = [7, 30, 100, 365] as const;

/**
 * Check if a new streak value has reached a milestone
 *
 * @param db - Database instance
 * @param userId - User ID
 * @param habitId - Habit ID
 * @param newStreak - The new streak count after completion
 * @returns Created notification if milestone reached, null otherwise
 */
export async function checkStreakMilestone(
	db: DB,
	userId: string,
	habitId: string,
	newStreak: number
): Promise<Notification | null> {
	// Check if we hit a milestone
	if (!STREAK_MILESTONES.includes(newStreak as (typeof STREAK_MILESTONES)[number])) {
		return null;
	}

	// Get habit title
	const habits = await db.select().from(habit).where(eq(habit.id, habitId)).limit(1);

	if (habits.length === 0) {
		return null;
	}

	const habitRecord = habits[0];
	const now = new Date();

	const metadata: StreakMilestoneMetadata = {
		kind: 'streak_milestone',
		milestone: newStreak,
		habitTitle: habitRecord.title
	};

	const notificationData = {
		id: crypto.randomUUID(),
		userId,
		type: 'streak_milestone' as const,
		habitId,
		goalId: null,
		title: `${newStreak}-Day Streak!`,
		body: `Amazing! You've completed "${habitRecord.title}" for ${newStreak} days in a row!`,
		metadata: JSON.stringify(metadata),
		read: false,
		dismissed: false,
		createdAt: now,
		expiresAt: null
	};

	// Insert notification
	await db.insert(notification).values(notificationData);

	return {
		...notificationData,
		metadata
	};
}

/**
 * Get the next milestone for a given streak
 * Useful for showing progress towards next milestone in UI
 */
export function getNextMilestone(currentStreak: number): number | null {
	for (const milestone of STREAK_MILESTONES) {
		if (currentStreak < milestone) {
			return milestone;
		}
	}
	return null;
}

/**
 * Calculate days until next milestone
 */
export function daysUntilNextMilestone(currentStreak: number): number | null {
	const next = getNextMilestone(currentStreak);
	if (next === null) return null;
	return next - currentStreak;
}
