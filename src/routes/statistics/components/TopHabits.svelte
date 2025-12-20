<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import type { HabitTrend, Scope } from '$lib/stats/types';

	interface Props {
		trends: HabitTrend[];
		activeTab: Scope;
		cardBase: string;
	}

	let { trends, activeTab, cardBase }: Props = $props();

	const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
</script>

<div class={`${cardBase} p-4 flex flex-col gap-3`}>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">
			{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} top habits
		</p>
		<span class="text-xs text-surface-400">vs previous period</span>
	</div>
	<div class="habits-scroll flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
		{#key activeTab}
			{#if trends.length > 0}
				{#each trends as habit (habit.habitId)}
					<div
						class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3 flex flex-col gap-2 text-surface-900 dark:text-surface-50"
					>
						<div class="flex items-center justify-between">
							<p class="font-semibold">{habit.title}</p>
							<span class={`text-xs ${habit.delta >= 0 ? 'text-success-500' : 'text-error-500'}`}>
								{habit.delta >= 0 ? '▲' : '▼'}
								{formatPercent(Math.abs(habit.delta))}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-16 text-sm font-semibold">{formatPercent(habit.completion)}</div>
							<div class="flex-1">
								<Progress value={habit.completion * 100}>
									<Progress.Track>
										<Progress.Range class="bg-primary-500" />
									</Progress.Track>
								</Progress>
							</div>
						</div>
						<p class="text-xs text-surface-400">Streak: {habit.streak} days</p>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-surface-400 py-4 text-center">No habits yet</p>
			{/if}
		{/key}
	</div>
</div>

<style>
	/* Custom scrollbar for dark theme */
	.habits-scroll::-webkit-scrollbar {
		width: 6px;
	}

	.habits-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.habits-scroll::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.habits-scroll::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.3);
	}
</style>
