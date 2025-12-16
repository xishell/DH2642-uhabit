/**
 * Helper functions for the statistics presenter
 */

import type { Scope, HabitTrend, ActivityItem } from '$lib/stats/types';
import { startOfDay, getMonthName, formatDate } from '$lib/utils/date';

export function getDateKey(scope: Scope, date: Date): string {
	if (scope === 'daily') return formatDate(date);
	if (scope === 'weekly') {
		const d = new Date(date);
		d.setDate(d.getDate() - d.getDay());
		return formatDate(d);
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format range label based on scope and date
 */
export function formatRangeLabel(scope: Scope, date: Date): string {
	if (scope === 'daily') {
		const today = startOfDay(new Date());
		const target = startOfDay(date);
		if (today.getTime() === target.getTime()) {
			return `Today (${getMonthName(date).slice(0, 3)} ${date.getDate()})`;
		}
		return `${getMonthName(date).slice(0, 3)} ${date.getDate()}`;
	}
	if (scope === 'weekly') {
		return 'This week';
	}
	return `${getMonthName(date)} ${date.getFullYear()}`;
}

/**
 * Determine activity kind based on trend delta
 */
function getActivityKind(delta: number): 'win' | 'neutral' | 'warning' {
	if (delta > 0.05) return 'win';
	if (delta < -0.05) return 'warning';
	return 'neutral';
}

/**
 * Get activity meta text based on trend
 */
function getActivityMeta(trend: HabitTrend, kind: 'win' | 'neutral' | 'warning'): string {
	if (kind === 'win') {
		return trend.streak > 3 ? `${trend.streak}-day streak` : 'Improving';
	}
	if (kind === 'warning') {
		return 'Needs attention';
	}
	return 'Steady';
}

/**
 * Build activity items from trends
 */
export function buildActivity(trends: HabitTrend[]): ActivityItem[] {
	return trends.slice(0, 4).map((trend) => {
		const kind = getActivityKind(trend.delta);
		const meta = getActivityMeta(trend, kind);

		return {
			habitId: trend.habitId,
			title: trend.title,
			meta,
			delta: `${trend.delta >= 0 ? '+' : ''}${Math.round(trend.delta * 100)}%`,
			kind
		};
	});
}
