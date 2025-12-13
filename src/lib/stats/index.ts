/**
 * Statistics computation module
 * Client-side computation for habit analytics
 */

// Types
export * from './types';

// Computation functions
export { computeHabitStreak, computeOverallStreak, computeAllHabitStreaks } from './computeStreaks';

export {
	computeCompletionRate,
	computeDailyRates,
	findBestDayOfWeek,
	findBestDate
} from './computeCompletionRate';

export { computeHeatmap, getHeatmapRange } from './computeHeatmap';

export {
	computeTrends,
	getSparklineRanges,
	getPeriodRanges,
	findMostConsistent,
	findNeedsAttention
} from './computeTrends';

export { computeInsights } from './computeInsights';
