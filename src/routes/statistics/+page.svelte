<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import { createStatisticsPresenter } from '$lib/presenters/statisticsPresenter';
	import type { Scope } from '$lib/stats/types';

	//  Create presenter instance
	const presenter = createStatisticsPresenter({
		fetcher: fetch,
		browser
	});

	//  Initialize presenter on mount
	onMount(() => {
		presenter.initialize();
	});

	// Subscribe to presenter state
	const state = presenter.state;

	// UI event handlers
	function changeScope(scope: Scope) {
		presenter.setScope(scope);
	}

	function changeDate(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.value) return;
		presenter.setSelectedDate(new Date(input.value));
	}

	function refresh() {
		presenter.refresh();
	}

	function clearCache() {
		if (confirm('Clear statistics cache?')) {
			presenter.clearCache();
		}
	}
</script>

<section class="p-6 space-y-6">
	<!-- Header & Controls -->
	<header class="space-y-4">
		<h1 class="text-2xl font-semibold">Statistics</h1>

		<div class="flex flex-wrap items-center gap-3">
			<!-- Scope switch -->
			<div class="flex rounded-lg overflow-hidden border">
				<button
					class="px-4 py-2 text-sm"
					class:bg-gray-900={$state.scope === 'daily'}
					class:text-white={$state.scope === 'daily'}
					on:click={() => changeScope('daily')}
				>
					Daily
				</button>
				<button
					class="px-4 py-2 text-sm"
					class:bg-gray-900={$state.scope === 'weekly'}
					class:text-white={$state.scope === 'weekly'}
					on:click={() => changeScope('weekly')}
				>
					Weekly
				</button>
				<button
					class="px-4 py-2 text-sm"
					class:bg-gray-900={$state.scope === 'monthly'}
					class:text-white={$state.scope === 'monthly'}
					on:click={() => changeScope('monthly')}
				>
					Monthly
				</button>
			</div>

			<!-- Date picker -->
			<input type="date" class="border rounded-lg px-3 py-2 text-sm" on:change={changeDate} />

			<!-- Actions -->
			<button
				class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
				disabled={$state.isSyncing}
				on:click={refresh}
			>
				{$state.isSyncing ? 'Syncing…' : 'Refresh'}
			</button>

			<button class="px-4 py-2 rounded-lg border text-sm" on:click={clearCache}>
				Clear cache
			</button>
		</div>
	</header>

	<!-- Offline / Error states -->
	{#if $state.isOffline}
		<p class="text-sm text-orange-600">Offline mode — showing cached data</p>
	{/if}

	{#if $state.error}
		<p class="text-sm text-red-600">{$state.error}</p>
	{/if}

	<!-- Loading state -->
	{#if $state.isLoading}
		<p class="text-gray-500">Loading statistics…</p>
	{:else}
		<!-- Period statistics -->
		{#if $state.periodStats}
			<section class="space-y-3">
				<h2 class="text-lg font-medium">{$state.periodStats.rangeLabel}</h2>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">
							{Math.round($state.periodStats.completionRate * 100)}%
						</p>
						<p class="text-xs text-gray-500">Completion</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$state.periodStats.streak}</p>
						<p class="text-xs text-gray-500">Current streak</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$state.periodStats.longestStreak}</p>
						<p class="text-xs text-gray-500">Longest streak</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$state.periodStats.completions}</p>
						<p class="text-xs text-gray-500">Completions</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- Snapshot -->
		{#if $state.snapshot}
			<section class="space-y-2">
				<h3 class="font-medium">Snapshot</h3>
				<p class="text-sm">
					Overall completion: {Math.round($state.snapshot.overallCompletion * 100)}%
				</p>
				<p class="text-sm">
					Weekly delta:
					<span class={$state.snapshot.weeklyDelta > 0 ? 'text-green-600' : 'text-red-600'}>
						{Math.round($state.snapshot.weeklyDelta * 100)}%
					</span>
				</p>
				<p class="text-sm">Most consistent: {$state.snapshot.mostConsistent ?? '—'}</p>
				<p class="text-sm">Needs attention: {$state.snapshot.needsAttention ?? '—'}</p>
			</section>
		{/if}

		<!-- Habit trends -->
		<section class="space-y-3">
			<h3 class="font-medium">Habit trends</h3>

			{#if $state.trends.length === 0}
				<p class="text-sm text-gray-500">No trends available</p>
			{:else}
				<ul class="space-y-2">
					{#each $state.trends as trend}
						<li class="grid grid-cols-4 gap-3 items-center">
							<span class="font-medium">{trend.title}</span>
							<span class="text-sm">{Math.round(trend.completion * 100)}%</span>
							<span
								class="text-sm"
								class:text-green-600={trend.delta > 0}
								class:text-red-600={trend.delta < 0}
							>
								{trend.delta >= 0 ? '+' : ''}{Math.round(trend.delta * 100)}%
							</span>
							<div class="flex items-end h-6 gap-0.5">
								{#each trend.spark as v}
									<span class="w-1 bg-current opacity-60" style="height: {v * 100}%"></span>
								{/each}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- Activity feed -->
		<section class="space-y-2">
			<h3 class="font-medium">Recent activity</h3>
			{#each $state.activity as item}
				<div
					class="flex justify-between text-sm"
					class:text-green-600={item.kind === 'win'}
					class:text-orange-600={item.kind === 'warning'}
				>
					<span>{item.title}</span>
					<span>{item.meta}</span>
					<span>{item.delta}</span>
				</div>
			{/each}
		</section>
	{/if}
</section>
