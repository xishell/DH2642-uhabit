<script lang="ts">
	import type { PeriodStats, ActivityItem, Scope } from '$lib/stats/types';

	interface Props {
		periodStats: PeriodStats;
		activity: ActivityItem[];
		activeTab: Scope;
		cardBase: string;
	}

	let { periodStats, activity, activeTab, cardBase }: Props = $props();
</script>

<div class={`${cardBase} p-4 flex flex-col gap-4`}>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">Activity pulse</p>
		<span class="text-xs text-surface-400">Recent habit activity</span>
	</div>
	<div class="grid md:grid-cols-3 gap-3">
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Total completions</p>
			<p class="text-2xl font-semibold text-surface-50">{periodStats.completions}</p>
			<p class="text-xs text-surface-400">Across all habits this {activeTab}</p>
		</div>
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Active days</p>
			<p class="text-2xl font-semibold text-surface-50">
				{Math.max(1, Math.round(periodStats.completionRate * 7))}/7
			</p>
			<p class="text-xs text-surface-400">Contribution-like cadence</p>
		</div>
		<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Top streak</p>
			<p class="text-2xl font-semibold text-surface-50">{periodStats.longestStreak} days</p>
			<p class="text-xs text-surface-400">Keep the chain going</p>
		</div>
	</div>
	{#if activity.length > 0}
		<div class="divide-y divide-surface-700 rounded-lg border border-surface-700 bg-surface-900">
			{#each activity as item (item.habitId)}
				<div class="p-3 flex items-center justify-between gap-3">
					<div>
						<p class="font-semibold text-surface-50">{item.title}</p>
						<p class="text-xs text-surface-400">{item.meta}</p>
					</div>
					<span
						class={`text-xs px-2 py-1 rounded-full border ${
							item.kind === 'win'
								? 'border-primary-500 text-primary-100 bg-primary-900'
								: item.kind === 'warning'
									? 'border-rose-500 text-rose-200 bg-rose-900/40'
									: 'border-surface-600 text-surface-200 bg-surface-800'
						}`}
					>
						{item.delta}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
