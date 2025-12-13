/**
 * Statistics types for client-side computation
 */

export type Scope = 'daily' | 'weekly' | 'monthly';

export interface DateRange {
	from: Date;
	to: Date;
}

/**
 * Overall statistics for a time period
 */
export interface PeriodStats {
	rangeLabel: string;
	completionRate: number; // 0-1
	bestDay: string;
	completions: number;
	streak: number;
	longestStreak: number;
}

/**
 * Trend data for an individual habit
 */
export interface HabitTrend {
	habitId: string;
	title: string;
	completion: number; // 0-1
	streak: number;
	delta: number; // Change vs previous period (-1 to 1)
	spark: number[]; // Sparkline values (0-1) for recent periods
}

/**
 * Single cell in a heatmap visualization
 */
export interface HeatCell {
	date: string; // YYYY-MM-DD, YYYY-Www, or YYYY-MM depending on scope
	value: number; // 0-1 intensity
	completions: number;
	total: number;
}

/**
 * Dashboard snapshot with key metrics
 */
export interface Snapshot {
	currentStreak: number;
	overallCompletion: number; // 0-1
	weeklyDelta: number; // Change vs previous week
	mostConsistent: string | null; // Habit title
	needsAttention: string | null; // Habit title
}

/**
 * Single insight card data
 */
export interface InsightCard {
	label: string;
	description: string;
}

/**
 * Advanced insights computed from habit data
 */
export interface Insights {
	volatility: InsightCard;
	bestWindow: InsightCard;
	nextMilestone: InsightCard;
	recoverySpeed: InsightCard;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
	habitId: string;
	title: string;
	meta: string;
	delta: string;
	kind: 'win' | 'neutral' | 'warning';
}

/**
 * Result of streak computation for a habit
 */
export interface StreakResult {
	currentStreak: number;
	longestStreak: number;
	streakStartDate: Date | null;
}

/**
 * Result of completion rate computation
 */
export interface CompletionRateResult {
	rate: number; // 0-1
	completed: number;
	total: number;
	byHabit: Map<string, { rate: number; completed: number; total: number }>;
}

/**
 * All computed statistics bundled together
 */
export interface ComputedStatistics {
	periodStats: PeriodStats;
	trends: HabitTrend[];
	heatmap: HeatCell[];
	snapshot: Snapshot;
	insights: Insights;
	activity: ActivityItem[];
}

/**
 * Cache metadata for sync tracking
 */
export interface CacheMetadata {
	lastHabitsSync: Date | null;
	lastCompletionsSync: Date | null;
	lastStatsCompute: Date | null;
	habitsETag: string | null;
	version: number;
}

/**
 * Cached computed statistics entry
 */
export interface CachedStats {
	id: string; // Format: `${scope}-${dateKey}`
	scope: Scope;
	dateKey: string;
	periodStats: PeriodStats;
	trends: HabitTrend[];
	heatmap: HeatCell[];
	snapshot: Snapshot;
	insights: Insights;
	activity: ActivityItem[];
	computedAt: Date;
	validUntil: Date;
}
