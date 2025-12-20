<script lang="ts">
	import { onMount } from 'svelte';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
	import { parseDate } from '@skeletonlabs/skeleton-svelte';
	import DatePicker from './components/DatePicker.svelte';
	import SnapshotCards from './components/SnapshotCards.svelte';
	import PeriodSummary from './components/PeriodSummary.svelte';
	import TopHabits from './components/TopHabits.svelte';
	import ActivityPulse from './components/ActivityPulse.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';
	import { createStatisticsPresenter } from '$lib/presenters/statisticsPresenter';
	import type { Scope } from '$lib/stats/types';
	import { formatDate } from '$lib/utils/date';

	const scopes: Scope[] = ['daily', 'weekly', 'monthly'];
	const cardBase =
		'rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-900 text-surface-900 dark:text-surface-50 shadow-sm';

	// Create presenter instance
	const presenter = createStatisticsPresenter({
		fetcher: fetch,
		browser: typeof window !== 'undefined'
	});

	const statsStore = presenter.state;

	let selectedRange = $state<DateValue[]>([parseDate(formatDate(new Date()))]);

	const isLoading = $derived($statsStore.isLoading);
	const isSyncing = $derived($statsStore.isSyncing);
	const isOffline = $derived($statsStore.isOffline);
	const error = $derived($statsStore.error);
	const lastSync = $derived($statsStore.lastSync);
	const activeTab = $derived($statsStore.scope);
	const currentPeriod = $derived($statsStore.periodStats);
	const currentTrends = $derived($statsStore.trends);
	const currentHeatmap = $derived($statsStore.heatmap);
	const snapshot = $derived($statsStore.snapshot);
	const activity = $derived($statsStore.activity);

	const lastSyncLabel = $derived(() => {
		if (!lastSync) return '';
		const now = new Date();
		const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
		if (diff < 60) return 'Just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		return `${Math.floor(diff / 3600)}h ago`;
	});

	onMount(() => {
		presenter.initialize();
	});

	const handleScopeChange = (value: string | null) => {
		if (!value) return;
		presenter.setScope(value as Scope);
	};

	const handleDateChange = (value: DateValue[]) => {
		selectedRange = value;
		if (value[0]) {
			const date = new Date(value[0].year, value[0].month - 1, value[0].day);
			presenter.setSelectedDate(date);
		}
	};
</script>

<div
	class="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8 rounded-3xl text-surface-900 dark:text-surface-50"
>
	<!-- Header -->
	<div class="flex items-center justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-3xl font-semibold">Statistics</h1>
			<p class="text-sm text-surface-400">
				{#if isOffline}
					<span class="text-warning-500">Offline mode</span> ·
				{/if}
				Snapshot of how your habits are trending.
			</p>
		</div>
		<div class="flex items-center gap-3 flex-wrap">
			<div class="min-w-[220px]">
				<DatePicker onchange={handleDateChange} value={selectedRange} />
			</div>
			<SegmentedControl
				value={activeTab}
				onValueChange={({ value }) => handleScopeChange(value)}
				name="stats-scope"
			>
				<SegmentedControl.Label class="text-xs text-surface-400">Range</SegmentedControl.Label>
				<SegmentedControl.Control class="min-w-[240px]">
					{#each scopes as scope}
						<SegmentedControl.Item value={scope}>
							<SegmentedControl.ItemText>
								{scope.charAt(0).toUpperCase() + scope.slice(1)}
							</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
					{/each}
					<SegmentedControl.Indicator />
				</SegmentedControl.Control>
			</SegmentedControl>
		</div>
	</div>

	<!-- Error state -->
	{#if error}
		<div class="rounded-xl border border-error-500/50 bg-error-900/20 p-4 text-error-200">
			<p class="font-semibold">Error loading statistics</p>
			<p class="text-sm">{error}</p>
			<button class="mt-2 text-sm underline hover:no-underline" onclick={() => presenter.refresh()}>
				Try again
			</button>
		</div>
	{/if}

	<!-- Loading state -->
	{#if isLoading && !currentPeriod}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
				></div>
				<p class="text-sm text-surface-400">Loading statistics...</p>
			</div>
		</div>
	{:else if snapshot && currentPeriod}
		<SnapshotCards {snapshot} periodStats={currentPeriod} {cardBase} />

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<PeriodSummary
				periodStats={currentPeriod}
				trends={currentTrends}
				heatmap={currentHeatmap}
				{activeTab}
				{isSyncing}
				{lastSyncLabel}
				{cardBase}
			/>
			<TopHabits trends={currentTrends} {activeTab} {cardBase} />
		</div>

		<ActivityPulse periodStats={currentPeriod} {activity} {activeTab} {cardBase} />
	{:else if !isLoading && !error}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<p class="text-lg font-semibold">No habits yet</p>
			<p class="text-sm text-surface-400">Create some habits to see your statistics here.</p>
			<a href="/habits" class="text-primary-500 hover:underline">Go to Habits</a>
		</div>
	{/if}
</div>

<style>
	:global(.heat-cell) {
		transition:
			transform 140ms ease,
			filter 140ms ease,
			box-shadow 140ms ease;
	}

	:global(.heat-cell:hover) {
		transform: scale(1.08);
		filter: brightness(1.08);
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
	}
</style>
