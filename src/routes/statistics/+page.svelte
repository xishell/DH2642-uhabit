<script lang="ts">
	import { browser } from '$app/environment';
	import { createStatisticsPresenter } from '$lib/presenters/statisticsPresenter';
	import type { Scope } from '$lib/stats/types';

	const presenter = createStatisticsPresenter({
		fetcher: fetch,
		browser
	});

	const state = presenter.state;

	$effect(() => {
		presenter.initialize();
	});

	const scopes: Scope[] = ['daily', 'weekly', 'monthly'];
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h1 class="text-2xl mb-6">Statistics</h1>

	<!-- Scope selector -->
	<div class="flex gap-2 mb-6">
		{#each scopes as scope}
			<button
				class="px-4 py-2 rounded {$state.scope === scope ? 'bg-primary-500' : 'bg-primary-900'}"
				onclick={() => presenter.setScope(scope)}
			>
				{scope}
			</button>
		{/each}
	</div>

	<!-- Loading -->
	{#if $state.isLoading}
		<p>Loading...</p>
	{:else if $state.error}
		<p class="text-error-500">{$state.error}</p>
	{:else}
		<!-- Period stats -->
		{#if $state.periodStats}
			<div class="mb-6 p-4 bg-primary-900 rounded">
				<p>Completion: {Math.round($state.periodStats.completionRate * 100)}%</p>
				<p>Streak: {$state.periodStats.streak} days</p>
			</div>
		{/if}

		<!-- Trends -->
		{#if $state.trends.length > 0}
			<div class="space-y-2">
				{#each $state.trends as trend}
					<div class="p-3 bg-primary-900 rounded flex justify-between">
						<span>{trend.title}</span>
						<span>{Math.round(trend.completion * 100)}%</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-primary-400">No habits found</p>
		{/if}
	{/if}
</div>
