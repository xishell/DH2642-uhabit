<script lang="ts">
	import type { Insights, PeriodStats } from '$lib/stats/types';

	interface Props {
		insights: Insights;
		periodStats: PeriodStats;
		cardBase: string;
	}

	let { insights, periodStats, cardBase }: Props = $props();
</script>

<div class={`${cardBase} p-4 flex flex-col gap-4`}>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">Insights & forecasts</p>
		<span class="text-xs text-surface-400">Computed in browser</span>
	</div>
	<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Volatility</p>
			<p class="text-xl font-semibold text-surface-50">{insights.volatility.label}</p>
			<p class="text-xs text-surface-400">{insights.volatility.description}</p>
		</div>
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Best window</p>
			<p class="text-xl font-semibold text-surface-50">{insights.bestWindow.label}</p>
			<p class="text-xs text-surface-400">{insights.bestWindow.description}</p>
		</div>
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Next milestone</p>
			<p class="text-xl font-semibold text-surface-50">{insights.nextMilestone.label}</p>
			<p class="text-xs text-surface-400">{insights.nextMilestone.description}</p>
		</div>
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Recovery speed</p>
			<p class="text-xl font-semibold text-surface-50">{insights.recoverySpeed.label}</p>
			<p class="text-xs text-surface-400">{insights.recoverySpeed.description}</p>
		</div>
	</div>
	<div class="rounded-lg border border-surface-700 bg-surface-800 p-3 flex flex-col gap-3">
		<p class="text-sm font-semibold">Opportunities</p>
		<ul class="space-y-2 text-sm text-surface-200 list-disc list-inside">
			<li>Focus day: shift tough habits to your best window ({insights.bestWindow.label}).</li>
			<li>
				Protect the streak: current best {periodStats.longestStreak} days; set reminders around
				{insights.bestWindow.label}.
			</li>
			<li>
				Recovery: average bounce-back {insights.recoverySpeed.label}. Plan a lighter day after
				misses.
			</li>
			<li>
				Stretch milestone: aim for {insights.nextMilestone.label} with consistent daily effort.
			</li>
		</ul>
	</div>
</div>
