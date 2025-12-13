/**
 * Advanced insights computation
 * Analyzes habit patterns to generate actionable insights
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';
import type { DateRange, Insights, InsightCard } from './types';
import { computeDailyRates } from './computeCompletionRate';
import { computeOverallStreak } from './computeStreaks';
import { formatDate, startOfDay } from '$lib/utils/date';

/**
 * Compute standard deviation of an array of numbers
 */
function standardDeviation(values: number[]): number {
	if (values.length === 0) return 0;

	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
	const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

	return Math.sqrt(avgSquaredDiff);
}

/**
 * Compute volatility insight
 * Measures how consistent completion rates are over time
 */
function computeVolatility(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): InsightCard {
	const dailyRates = computeDailyRates(habits, completions, range);
	const stdDev = standardDeviation(dailyRates);

	let label: string;
	let description: string;

	if (stdDev < 0.15) {
		label = 'Low';
		description = `Consistent performance, within ±${Math.round(stdDev * 100)}% variation`;
	} else if (stdDev < 0.3) {
		label = 'Medium';
		description = `Some variability, ±${Math.round(stdDev * 100)}% daily swing`;
	} else {
		label = 'High';
		description = `Inconsistent patterns, ±${Math.round(stdDev * 100)}% variation`;
	}

	return { label, description };
}

/**
 * Compute best time window insight
 * Analyzes completion timestamps to find peak hours
 */
function computeBestWindow(completions: HabitCompletion[], range: DateRange): InsightCard {
	// Filter completions to range
	const rangeCompletions = completions.filter((c) => {
		const date = new Date(c.completedAt);
		return date >= range.from && date <= range.to;
	});

	if (rangeCompletions.length === 0) {
		return { label: 'No data', description: 'Complete more habits to see patterns' };
	}

	// Count completions by hour bucket (morning, afternoon, evening, night)
	const buckets = {
		morning: 0, // 5-11
		afternoon: 0, // 12-17
		evening: 0, // 18-22
		night: 0 // 23-4
	};

	for (const completion of rangeCompletions) {
		const hour = new Date(completion.completedAt).getHours();
		if (hour >= 5 && hour < 12) buckets.morning++;
		else if (hour >= 12 && hour < 18) buckets.afternoon++;
		else if (hour >= 18 && hour < 23) buckets.evening++;
		else buckets.night++;
	}

	// Find best bucket
	const entries = Object.entries(buckets) as [keyof typeof buckets, number][];
	entries.sort((a, b) => b[1] - a[1]);
	const best = entries[0][0];

	const labels: Record<keyof typeof buckets, string> = {
		morning: '5-11 AM',
		afternoon: '12-5 PM',
		evening: '6-10 PM',
		night: 'Night'
	};

	const descriptions: Record<keyof typeof buckets, string> = {
		morning: 'Most productive in the morning hours',
		afternoon: 'Peak performance in the afternoon',
		evening: 'Best results in the evening',
		night: 'Night owl - most active late'
	};

	return { label: labels[best], description: descriptions[best] };
}

/**
 * Compute next milestone insight
 * Projects when the next streak milestone will be reached
 */
function computeNextMilestone(
	habits: Habit[],
	completions: HabitCompletion[],
	asOfDate: Date
): InsightCard {
	const streak = computeOverallStreak(habits, completions, asOfDate);
	const current = streak.currentStreak;

	// Define milestones
	const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
	const nextMilestone = milestones.find((m) => m > current) || current + 30;

	const daysToGo = nextMilestone - current;

	if (daysToGo <= 0) {
		return { label: `Day ${current}`, description: 'Amazing streak! Keep going!' };
	}

	// Project date
	const targetDate = new Date(asOfDate);
	targetDate.setDate(targetDate.getDate() + daysToGo);
	const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

	return {
		label: `Day ${nextMilestone}`,
		description: `${daysToGo} days to go, projected ${dayName}`
	};
}

/**
 * Compute recovery speed insight
 * Measures how quickly user bounces back after missing habits
 */
function computeRecoverySpeed(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange
): InsightCard {
	const dailyRates = computeDailyRates(habits, completions, range);

	if (dailyRates.length < 7) {
		return { label: 'Not enough data', description: 'Need more history for analysis' };
	}

	// Find "miss" days (rate < 0.3) and measure recovery
	const recoveryTimes: number[] = [];
	let missStart: number | null = null;

	for (let i = 0; i < dailyRates.length; i++) {
		if (dailyRates[i] < 0.3) {
			if (missStart === null) {
				missStart = i;
			}
		} else if (missStart !== null) {
			// Recovery detected
			recoveryTimes.push(i - missStart);
			missStart = null;
		}
	}

	if (recoveryTimes.length === 0) {
		return { label: 'No misses', description: 'Perfect consistency in this period!' };
	}

	const avgRecovery = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
	const rounded = Math.round(avgRecovery);

	let description: string;
	if (rounded <= 1) {
		description = 'Quick bouncebacks - great resilience!';
	} else if (rounded <= 3) {
		description = 'Healthy recovery pattern';
	} else {
		description = 'Consider lighter days after misses';
	}

	return {
		label: `${rounded} day${rounded !== 1 ? 's' : ''}`,
		description
	};
}

/**
 * Compute all insights
 *
 * @param habits - All habits
 * @param completions - All completions
 * @param range - Date range for analysis
 * @param asOfDate - Reference date
 */
export function computeInsights(
	habits: Habit[],
	completions: HabitCompletion[],
	range: DateRange,
	asOfDate: Date = new Date()
): Insights {
	return {
		volatility: computeVolatility(habits, completions, range),
		bestWindow: computeBestWindow(completions, range),
		nextMilestone: computeNextMilestone(habits, completions, asOfDate),
		recoverySpeed: computeRecoverySpeed(habits, completions, range)
	};
}
