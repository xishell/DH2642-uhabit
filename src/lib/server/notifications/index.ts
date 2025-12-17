/**
 * Notification Generation Module
 *
 * This module provides functions to generate notifications for various events:
 * - Streak milestones (7, 30, 100, 365 days)
 * - Goal progress thresholds (25%, 50%, 75%, 100%)
 * - Holiday conflicts (habits scheduled on public holidays)
 */

export {
	checkStreakMilestone,
	getNextMilestone,
	daysUntilNextMilestone
} from './checkStreakMilestone';

export { checkGoalProgress, getNextProgressThreshold } from './checkGoalProgress';

export {
	checkHolidayConflictsForUser,
	checkHolidayConflictsForAllUsers
} from './checkHolidayConflicts';
