<script lang="ts">
	import type { PeriodStats, Snapshot } from '$lib/stats/types';

	interface Props {
		snapshot: Snapshot;
		periodStats: PeriodStats;
		cardBase: string;
	}

	let { snapshot, periodStats, cardBase }: Props = $props();

	const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
	<div class={`${cardBase} p-4`}>
		<p class="text-xs uppercase tracking-wide text-surface-400">Current streak</p>
		<p class="text-3xl font-semibold">{snapshot.currentStreak} days</p>
		<div class="mt-2 flex items-center gap-2 text-xs text-surface-400">
			Longest {periodStats.longestStreak} · Active {periodStats.streak}
		</div>
	</div>
	<div class={`${cardBase} p-4`}>
		<p class="text-xs uppercase tracking-wide text-surface-400">Overall completion</p>
		<p class="text-3xl font-semibold flex items-baseline gap-2">
			{formatPercent(snapshot.overallCompletion)}
			<span class={`text-xs ${snapshot.weeklyDelta >= 0 ? 'text-success-500' : 'text-error-500'}`}>
				{snapshot.weeklyDelta >= 0 ? '▲' : '▼'}
				{formatPercent(Math.abs(snapshot.weeklyDelta))}
			</span>
		</p>
	</div>
	<div class={`${cardBase} p-4`}>
		<p class="text-xs uppercase tracking-wide text-surface-400">Most consistent</p>
		<p class="text-lg font-semibold">{snapshot.mostConsistent || 'N/A'}</p>
		<p class="text-xs text-surface-400">Locked in — keep it rolling</p>
	</div>
	<div class={`${cardBase} p-4`}>
		<p class="text-xs uppercase tracking-wide text-surface-400">Needs attention</p>
		<p class="text-lg font-semibold text-warning-500">{snapshot.needsAttention || 'N/A'}</p>
		<p class="text-xs text-surface-400">Focus here this week</p>
	</div>
</div>
