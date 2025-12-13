<script lang="ts">
	import { onMount } from 'svelte';
	import { SegmentedControl, Progress } from '@skeletonlabs/skeleton-svelte';
	import { parseDate } from '@skeletonlabs/skeleton-svelte';
	import DatePicker from './components/DatePicker.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';
	import { createStatisticsPresenter } from '$lib/presenters/statisticsPresenter';
	import type { Scope, HeatCell } from '$lib/stats/types';
	import { formatDate } from '$lib/utils/date';

	const scopes: Scope[] = ['daily', 'weekly', 'monthly'];
	const cardBase = 'rounded-2xl border border-surface-700 bg-surface-900 text-surface-50 shadow-sm';

	// Create presenter
	const presenter = createStatisticsPresenter({
		fetcher: fetch,
		browser: typeof window !== 'undefined'
	});

	// Subscribe to presenter state (renamed to avoid conflict with $state rune)
	const statsStore = presenter.state;

	// Local UI state
	let selectedRange = $state<DateValue[]>([parseDate(formatDate(new Date()))]);

	// Derived values from presenter state
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
	const insights = $derived($statsStore.insights);
	const activity = $derived($statsStore.activity);

	// Derived heatmap grid
	const heatmapGrid = $derived(chunkHeatmap(currentHeatmap, 12));

	// Format last sync time
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

	const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

	const heatBucket = (value: number) => {
		const v = Math.max(0, Math.min(1, value));
		if (v >= 0.8) return 'bg-primary-500/95 shadow-[0_2px_6px_rgba(0,0,0,0.35)]';
		if (v >= 0.6) return 'bg-primary-400/90 shadow-[0_2px_5px_rgba(0,0,0,0.3)]';
		if (v >= 0.4) return 'bg-primary-300/90 shadow-[0_1px_4px_rgba(0,0,0,0.25)]';
		if (v >= 0.2) return 'bg-primary-200/85 shadow-[0_1px_3px_rgba(0,0,0,0.2)]';
		return 'bg-surface-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.15)]';
	};

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

	function chunkHeatmap(cells: HeatCell[], size: number) {
		const rows: HeatCell[][] = [];
		for (let i = 0; i < cells.length; i += size) {
			rows.push(cells.slice(i, i + size));
		}
		return rows;
	}
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8 rounded-3xl text-surface-50">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-3xl font-semibold">Statistics</h1>
			<p class="text-sm text-surface-400">
				{#if isOffline}
					<span class="text-amber-400">Offline mode</span> ·
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
		<div class="rounded-xl border border-rose-500/50 bg-rose-900/20 p-4 text-rose-200">
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
		<!-- Snapshot cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class={`${cardBase} p-4`}>
				<p class="text-xs uppercase tracking-wide text-surface-400">Current streak</p>
				<p class="text-3xl font-semibold">{snapshot.currentStreak} days</p>
				<div class="mt-2 flex items-center gap-2 text-xs text-surface-400">
					Longest {currentPeriod.longestStreak} · Active {currentPeriod.streak}
				</div>
			</div>
			<div class={`${cardBase} p-4`}>
				<p class="text-xs uppercase tracking-wide text-surface-400">Overall completion</p>
				<p class="text-3xl font-semibold flex items-baseline gap-2">
					{formatPercent(snapshot.overallCompletion)}
					<span
						class={`text-xs ${snapshot.weeklyDelta >= 0 ? 'text-primary-600' : 'text-rose-500'}`}
					>
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
				<p class="text-lg font-semibold text-rose-500">{snapshot.needsAttention || 'N/A'}</p>
				<p class="text-xs text-surface-400">Focus here this week</p>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Period summary -->
			<div class={`${cardBase} p-4 lg:col-span-2 flex flex-col gap-4`}>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs uppercase tracking-wide text-surface-400">Period</p>
						<p class="text-lg font-semibold">{currentPeriod.rangeLabel}</p>
					</div>
					<span class="text-sm text-surface-400">
						{#if isSyncing}
							Syncing...
						{:else}
							Updated {lastSyncLabel()}
						{/if}
					</span>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#key activeTab}
						{#each [['Completion', formatPercent(currentPeriod.completionRate)], ['Completions', currentPeriod.completions.toString()], ['Best day', currentPeriod.bestDay], ['Streak', `${currentPeriod.streak} (best ${currentPeriod.longestStreak})`]] as [label, value]}
							<div
								class="rounded-xl border border-surface-700 bg-surface-800 px-3 py-2 text-surface-50"
							>
								<p class="text-xs text-surface-400">{label}</p>
								<p class="text-lg font-semibold">{value}</p>
							</div>
						{/each}
					{/key}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="rounded-xl border border-surface-700 bg-surface-800 p-4 text-surface-50">
						<p class="text-sm font-semibold mb-3">Recent momentum</p>
						<div class="flex items-end gap-2 h-28">
							{#key activeTab}
								{#if currentTrends.length > 0 && currentTrends[0].spark.length > 0}
									{#each currentTrends[0].spark as value, idx}
										<div
											class="flex-1 rounded-full bg-primary-200"
											style={`height:${20 + value * 70}%`}
											aria-label={`Day ${idx + 1} value ${formatPercent(value)}`}
										></div>
									{/each}
								{:else}
									<p class="text-sm text-surface-400 m-auto">No data yet</p>
								{/if}
							{/key}
						</div>
						{#if currentTrends.length > 0}
							<p class="text-xs text-surface-400 mt-2">
								{currentTrends[0].title}, last {currentTrends[0].spark.length} periods
							</p>
						{/if}
					</div>

					<div class="rounded-xl border border-surface-700 bg-surface-800 p-4 text-surface-50">
						<p class="text-sm font-semibold mb-3">Consistency heatmap</p>
						<div class="pb-2">
							{#key activeTab}
								{#if heatmapGrid.length > 0}
									<div class="flex flex-col gap-1">
										{#each heatmapGrid as row, rowIdx (rowIdx)}
											<div class="grid grid-cols-12 gap-1">
												{#each row as cell (cell.date)}
													<div
														class={`heat-cell h-4 w-4 rounded-[2px] outline outline-1 outline-surface-700/70 ${heatBucket(cell.value)}`}
														title={`${cell.date} — ${formatPercent(cell.value)}`}
													></div>
												{/each}
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-surface-400">No data yet</p>
								{/if}
							{/key}
						</div>
						<div class="flex items-center gap-2 mt-3 text-xs text-surface-400">
							<span>Less</span>
							<div class="flex items-center gap-1">
								{#each [0, 0.2, 0.4, 0.6, 0.8] as level (level)}
									<div
										class={`heat-cell w-4 h-3 rounded-[2px] outline outline-1 outline-surface-700/70 ${heatBucket(level)}`}
									></div>
								{/each}
							</div>
							<span>More</span>
							<span class="ml-auto">
								Streak: {currentPeriod.streak} / Best: {currentPeriod.longestStreak}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Top habits -->
			<div class={`${cardBase} p-4 flex flex-col gap-3`}>
				<div class="flex items-center justify-between">
					<p class="text-sm font-semibold">Top habits this {activeTab}</p>
					<span class="text-xs text-surface-400">vs previous period</span>
				</div>
				<div class="flex flex-col gap-3">
					{#key activeTab}
						{#if currentTrends.length > 0}
							{#each currentTrends as habit (habit.habitId)}
								<div
									class="rounded-xl border border-surface-700 bg-surface-800 p-3 flex flex-col gap-2 text-surface-50"
								>
									<div class="flex items-center justify-between">
										<p class="font-semibold">{habit.title}</p>
										<span
											class={`text-xs ${habit.delta >= 0 ? 'text-primary-600' : 'text-rose-500'}`}
										>
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
		</div>

		<!-- Activity pulse -->
		<div class={`${cardBase} p-4 flex flex-col gap-4`}>
			<div class="flex items-center justify-between">
				<p class="text-sm font-semibold">Activity pulse</p>
				<span class="text-xs text-surface-400">Recent habit activity</span>
			</div>
			<div class="grid md:grid-cols-3 gap-3">
				<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
					<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Total completions</p>
					<p class="text-2xl font-semibold text-surface-50">{currentPeriod.completions}</p>
					<p class="text-xs text-surface-400">Across all habits this {activeTab}</p>
				</div>
				<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
					<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Active days</p>
					<p class="text-2xl font-semibold text-surface-50">
						{Math.max(1, Math.round(currentPeriod.completionRate * 7))}/7
					</p>
					<p class="text-xs text-surface-400">Contribution-like cadence</p>
				</div>
				<div class="rounded-lg border border-surface-700 bg-surface-800 p-3">
					<p class="text-xs uppercase tracking-wide text-surface-400 mb-1">Top streak</p>
					<p class="text-2xl font-semibold text-surface-50">{currentPeriod.longestStreak} days</p>
					<p class="text-xs text-surface-400">Keep the chain going</p>
				</div>
			</div>
			{#if activity.length > 0}
				<div
					class="divide-y divide-surface-700 rounded-lg border border-surface-700 bg-surface-900"
				>
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

		<!-- Insights & forecasts -->
		{#if insights}
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
						<li>
							Focus day: shift tough habits to your best window ({insights.bestWindow.label}).
						</li>
						<li>
							Protect the streak: current best {currentPeriod.longestStreak} days; set reminders around
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
		{/if}
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
	/* Keep scrollbar styling scoped to this page */
	:global(.statistics-scroll::-webkit-scrollbar) {
		width: 26px;
	}

	:global(.statistics-scroll::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.statistics-scroll::-webkit-scrollbar-thumb) {
		width: 0px;
		background-color: #f4f4f4a8;
		background-clip: content-box;
		border-radius: 99px;
		border: 10px solid transparent;
	}

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
