export type NotificationType =
	| 'habit_reminder'
	| 'streak_milestone'
	| 'goal_progress'
	| 'holiday_reschedule';

export type Notification = {
	id: string;
	userId: string;
	type: NotificationType;
	habitId: string | null;
	goalId: string | null;
	title: string;
	body: string;
	metadata: NotificationMetadata | null;
	read: boolean;
	dismissed: boolean;
	createdAt: Date;
	expiresAt: Date | null;
};

/**
 * Metadata types for different notification kinds
 */
export type NotificationMetadata =
	| StreakMilestoneMetadata
	| GoalProgressMetadata
	| HabitReminderMetadata
	| HolidayRescheduleMetadata;

export type StreakMilestoneMetadata = {
	kind: 'streak_milestone';
	milestone: number;
	habitTitle: string;
};

export type GoalProgressMetadata = {
	kind: 'goal_progress';
	percentage: number;
	goalTitle: string;
};

export type HabitReminderMetadata = {
	kind: 'habit_reminder';
	habitCount: number;
};

export type HolidayRescheduleMetadata = {
	kind: 'holiday_reschedule';
	holidayDate: string;
	holidayName: string;
	conflictingHabits: Array<{ id: string; title: string }>;
	suggestedDate: string;
};

/**
 * Push subscription stored in database
 */
export type PushSubscription = {
	id: string;
	userId: string;
	endpoint: string;
	keys: PushSubscriptionKeys;
	userAgent: string | null;
	createdAt: Date;
	lastUsedAt: Date | null;
};

export type PushSubscriptionKeys = {
	p256dh: string;
	auth: string;
};

/**
 * Minimal payload for trigger-only push (privacy-preserving)
 */
export type PushTriggerPayload = {
	type: 'wake';
	timestamp: number;
};

/**
 * Notification with parsed metadata (for frontend use)
 */
export type NotificationWithActions = Notification & {
	actions?: NotificationAction[];
};

export type NotificationAction = {
	label: string;
	action: 'reschedule' | 'skip' | 'dismiss' | 'view';
	targetDate?: string;
	url?: string;
};

/**
 * User notification preferences
 */
export type NotificationPreferences = {
	enabled: boolean;
	habitReminders: boolean;
	reminderTime: string; // "HH:MM" format
	streakMilestones: boolean;
	goalProgress: boolean;
	holidaySuggestions: boolean;
	pushEnabled: boolean;
};

/**
 * Default notification preferences for new users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
	enabled: true,
	habitReminders: true,
	reminderTime: '08:00',
	streakMilestones: true,
	goalProgress: true,
	holidaySuggestions: true,
	pushEnabled: false
};
