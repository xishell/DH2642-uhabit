import { eq } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { habit, notification } from '$lib/server/db/schema';
import type { Notification, StreakMilestoneMetadata } from '$lib/types/notification';
import { sendWakeUpPush, getPushConfig } from '$lib/server/push';

/** Milestone streak values that trigger notifications */
const STREAK_MILESTONES = [7, 30, 100, 365] as const;

export interface NotificationOptions {
	/** Environment variables for push config */
	env?: { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string };
	/** Context for non-blocking operations */
	waitUntil?: (promise: Promise<unknown>) => void;
}

/**
 * Check if a new streak value has reached a milestone
 *
 * @param db - Database instance
 * @param userId - User ID
 * @param habitId - Habit ID
 * @param newStreak - The new streak count after completion
 * @param options - Optional push notification config
 * @returns Created notification if milestone reached, null otherwise
 */
export async function checkStreakMilestone(
	db: DB,
	userId: string,
	habitId: string,
	newStreak: number,
	options?: NotificationOptions
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

	// Send push notification if configured
	if (options?.env) {
		const pushConfig = getPushConfig(options.env);
		if (pushConfig) {
			const pushPromise = sendWakeUpPush(db, userId, pushConfig).catch((err) => {
				console.error('[Push] Failed to send streak milestone push:', err);
			});

			// Use waitUntil for non-blocking send, otherwise await
			if (options.waitUntil) {
				options.waitUntil(pushPromise);
			} else {
				await pushPromise;
			}
		}
	}

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
