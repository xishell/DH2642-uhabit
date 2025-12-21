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
		<div
			class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3"
		>
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Total completions</p>
			<p class="text-2xl font-semibold text-surface-900 dark:text-surface-50">
				{periodStats.completions}
			</p>
			<p class="text-xs text-surface-400">Across all habits this {activeTab}</p>
		</div>
		<div
			class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3"
		>
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Active days</p>
			<p class="text-2xl font-semibold text-surface-900 dark:text-surface-50">
				{Math.max(1, Math.round(periodStats.completionRate * 7))}/7
			</p>
			<p class="text-xs text-surface-400">Contribution-like cadence</p>
		</div>
		<div
			class="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3"
		>
			<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Top streak</p>
			<p class="text-2xl font-semibold text-surface-900 dark:text-surface-50">
				{periodStats.longestStreak} days
			</p>
			<p class="text-xs text-surface-400">Keep the chain going</p>
		</div>
	</div>
	{#if activity.length > 0}
		<div
			class="divide-y divide-surface-200 dark:divide-surface-700 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
		>
			{#each activity as item (item.habitId)}
				<div class="p-3 flex items-center justify-between gap-3 min-w-0">
					<div class="min-w-0">
						<p
							class="font-semibold text-surface-900 dark:text-surface-50 truncate"
							title={item.title}
						>
							{item.title}
						</p>
						<p class="text-xs text-surface-400">{item.meta}</p>
					</div>
					<span
						class={`text-xs px-2 py-1 rounded-full border ${
							item.kind === 'win'
								? 'border-success-500 text-success-900 dark:text-success-100 bg-success-100 dark:bg-success-900'
								: item.kind === 'warning'
									? 'border-warning-500 text-warning-900 dark:text-warning-200 bg-warning-100 dark:bg-warning-900/40'
									: 'border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800'
						}`}
					>
						{item.delta}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
