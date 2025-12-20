import { eq } from 'drizzle-orm';
import type { DB } from '$lib/server/api-helpers';
import { goal, notification } from '$lib/server/db/schema';
import type { Notification, GoalProgressMetadata } from '$lib/types/notification';

/** Progress thresholds that trigger notifications (percentages) */
const PROGRESS_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Check if goal progress has crossed a notification threshold
 *
 * @param db - Database instance
 * @param userId - User ID
 * @param goalId - Goal ID
 * @param previousProgress - Progress percentage before this update (0-100)
 * @param newProgress - Progress percentage after this update (0-100)
 * @returns Created notification if threshold crossed, null otherwise
 */
export async function checkGoalProgress(
	db: DB,
	userId: string,
	goalId: string,
	previousProgress: number,
	newProgress: number
): Promise<Notification | null> {
	// Find if we crossed a threshold
	const crossedThreshold = PROGRESS_THRESHOLDS.find(
		(threshold) => previousProgress < threshold && newProgress >= threshold
	);

	if (!crossedThreshold) {
		return null;
	}

	// Get goal title
	const goals = await db.select().from(goal).where(eq(goal.id, goalId)).limit(1);

	if (goals.length === 0) {
		return null;
	}

	const goalRecord = goals[0];
	const now = new Date();

	const isComplete = crossedThreshold === 100;

	const metadata: GoalProgressMetadata = {
		kind: 'goal_progress',
		percentage: crossedThreshold,
		goalTitle: goalRecord.title
	};

	const notificationData = {
		id: crypto.randomUUID(),
		userId,
		type: 'goal_progress' as const,
		habitId: null,
		goalId,
		title: isComplete ? 'Goal Complete!' : `${crossedThreshold}% Progress`,
		body: isComplete
			? `Congratulations! You've completed "${goalRecord.title}"!`
			: `You're ${crossedThreshold}% of the way through "${goalRecord.title}"`,
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
 * Get the next progress threshold for a given percentage
 */
export function getNextProgressThreshold(currentProgress: number): number | null {
	for (const threshold of PROGRESS_THRESHOLDS) {
		if (currentProgress < threshold) {
			return threshold;
		}
	}
	return null;
}
