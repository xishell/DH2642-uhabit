<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import { createStatisticsPresenter } from '$lib/presenters/statisticsPresenter';
	import type { Scope } from '$lib/stats/types';

	//code section from main atm to avoid conflicts--------------------->>>>>>>>>>>>>>>>>
	import StatPanel from './components/StatPanel.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';
	import type { HabitStat, HabitType } from './types';
	//code section from main atm to avoid conflicts---------------------<<<<<<<<<<<<<<<<<<<<

	//  Create presenter instance
	const presenter = createStatisticsPresenter({
		fetcher: fetch,
		browser
	});

	//  Initialize presenter on mount
	onMount(() => {
		presenter.initialize();
	});

	// Subscribe to presenter statisticsState
	const statisticsState = presenter.state;

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

	//code section from main atm to avoid conflicts--------------------->>>>>>>>>>>>>>>>>

	// Helper function to format DateValue to string (YYYY-MM-DD)
	function formatDateValue(dateValue: DateValue): string {
		const year = dateValue.year;
		const month = String(dateValue.month).padStart(2, '0');
		const day = String(dateValue.day).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Mock data
	const HABITS = {
		read: 'read books',
		drink: 'drink water',
		workout: 'work out',
		meditation: 'meditation',
		journaling: 'journaling',
		news: 'reading news',
		language: 'language study',
		coding: 'coding',
		walking: 'walking',
		stretching: 'stretching',
		water: 'drink water',
		run: 'run'
	} as const;

	const DATES = {
		first: '2025-11-20',
		second: '2025-11-21'
	} as const;

	const dailyHabitStats: HabitStat[] = [
		{
			date: DATES.first,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.8 },
				{ habitTitle: HABITS.drink, completionRate: 0.9 },
				{ habitTitle: HABITS.workout, completionRate: 0.4 },
				{ habitTitle: HABITS.meditation, completionRate: 0.1 },
				{ habitTitle: HABITS.journaling, completionRate: 0.4 },
				{ habitTitle: HABITS.coding, completionRate: 0.34 },
				{ habitTitle: HABITS.walking, completionRate: 0.4 },
				{ habitTitle: HABITS.stretching, completionRate: 0.52 },
				{ habitTitle: HABITS.news, completionRate: 0.14 },
				{ habitTitle: HABITS.language, completionRate: 0.04 }
			]
		},
		{
			date: DATES.second,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.6 },
				{ habitTitle: HABITS.drink, completionRate: 0.95 },
				{ habitTitle: HABITS.workout, completionRate: 0.7 },
				{ habitTitle: HABITS.meditation, completionRate: 0.3 }
			]
		}
	];

	const weeklyHabitStats: HabitStat[] = [
		{
			date: DATES.first,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.75 },
				{ habitTitle: HABITS.drink, completionRate: 0.85 },
				{ habitTitle: HABITS.workout, completionRate: 0.5 },
				{ habitTitle: HABITS.meditation, completionRate: 0.25 },
				{ habitTitle: HABITS.journaling, completionRate: 0.6 }
			]
		},
		{
			date: DATES.second,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.7 },
				{ habitTitle: HABITS.drink, completionRate: 0.88 },
				{ habitTitle: HABITS.workout, completionRate: 0.45 }
			]
		}
	];

	const monthlyHabitStats: HabitStat[] = [
		{
			date: DATES.first,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.65 },
				{ habitTitle: HABITS.drink, completionRate: 0.82 },
				{ habitTitle: HABITS.workout, completionRate: 0.38 },
				{ habitTitle: HABITS.meditation, completionRate: 0.2 }
			]
		},
		{
			date: DATES.second,
			data: [
				{ habitTitle: HABITS.read, completionRate: 0.72 },
				{ habitTitle: HABITS.drink, completionRate: 0.9 },
				{ habitTitle: HABITS.workout, completionRate: 0.55 },
				{ habitTitle: HABITS.meditation, completionRate: 0.35 },
				{ habitTitle: HABITS.journaling, completionRate: 0.48 }
			]
		}
	];

	// DatePicker selected dates (using $state for Svelte 5 reactivity)
	let selectedDateForDaily: string = $state(DATES.first);
	let selectedDateForWeekly: string = $state(DATES.first);
	let selectedDateForMonthly: string = $state(DATES.first);

	// Date change handlers
	function handleDailyDateChange(value: DateValue[]) {
		if (value.length > 0) {
			selectedDateForDaily = formatDateValue(value[0]);
		}
	}

	function handleWeeklyDateChange(value: DateValue[]) {
		if (value.length > 0) {
			selectedDateForWeekly = formatDateValue(value[0]);
		}
	}

	function handleMonthlyDateChange(value: DateValue[]) {
		if (value.length > 0) {
			selectedDateForMonthly = formatDateValue(value[0]);
		}
	}

	let viewHeight = $state<Record<HabitType, number>>({ daily: 180, weekly: 180, monthly: 180 });
	let isDragging = $state<Record<HabitType, boolean>>({
		daily: false,
		weekly: false,
		monthly: false
	});

	const panels: {
		key: HabitType;
		title: string;
		stats: HabitStat[];
		onChange: (v: DateValue[]) => void;
	}[] = [
		{ key: 'daily', title: 'Daily', stats: dailyHabitStats, onChange: handleDailyDateChange },
		{ key: 'weekly', title: 'Weekly', stats: weeklyHabitStats, onChange: handleWeeklyDateChange },
		{
			key: 'monthly',
			title: 'Monthly',
			stats: monthlyHabitStats,
			onChange: handleMonthlyDateChange
		}
	];
	//code section from main atm to avoid conflicts---------------------<<<<<<<<<<<<<<<<<<<<
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
					class:bg-gray-900={$statisticsState.scope === 'daily'}
					class:text-white={$statisticsState.scope === 'daily'}
					on:click={() => changeScope('daily')}
				>
					Daily
				</button>
				<button
					class="px-4 py-2 text-sm"
					class:bg-gray-900={$statisticsState.scope === 'weekly'}
					class:text-white={$statisticsState.scope === 'weekly'}
					on:click={() => changeScope('weekly')}
				>
					Weekly
				</button>
				<button
					class="px-4 py-2 text-sm"
					class:bg-gray-900={$statisticsState.scope === 'monthly'}
					class:text-white={$statisticsState.scope === 'monthly'}
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
				disabled={$statisticsState.isSyncing}
				on:click={refresh}
			>
				{$statisticsState.isSyncing ? 'Syncing…' : 'Refresh'}
			</button>

			<button class="px-4 py-2 rounded-lg border text-sm" on:click={clearCache}>
				Clear cache
			</button>
		</div>
	</header>

	<!-- Offline / Error states -->
	{#if $statisticsState.isOffline}
		<p class="text-sm text-orange-600">Offline mode — showing cached data</p>
	{/if}

	{#if $statisticsState.error}
		<p class="text-sm text-red-600">{$statisticsState.error}</p>
	{/if}

	<!-- Loading statisticsState -->
	{#if $statisticsState.isLoading}
		<p class="text-gray-500">Loading statistics…</p>
	{:else}
		<!-- Period statistics -->
		{#if $statisticsState.periodStats}
			<section class="space-y-3">
				<h2 class="text-lg font-medium">{$statisticsState.periodStats.rangeLabel}</h2>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">
							{Math.round($statisticsState.periodStats.completionRate * 100)}%
						</p>
						<p class="text-xs text-gray-500">Completion</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$statisticsState.periodStats.streak}</p>
						<p class="text-xs text-gray-500">Current streak</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$statisticsState.periodStats.longestStreak}</p>
						<p class="text-xs text-gray-500">Longest streak</p>
					</div>
					<div class="p-4 rounded-xl bg-gray-100">
						<p class="text-xl font-semibold">{$statisticsState.periodStats.completions}</p>
						<p class="text-xs text-gray-500">Completions</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- Snapshot -->
		{#if $statisticsState.snapshot}
			<section class="space-y-2">
				<h3 class="font-medium">Snapshot</h3>
				<p class="text-sm">
					Overall completion: {Math.round($statisticsState.snapshot.overallCompletion * 100)}%
				</p>
				<p class="text-sm">
					Weekly delta:
					<span
						class={$statisticsState.snapshot.weeklyDelta > 0 ? 'text-green-600' : 'text-red-600'}
					>
						{Math.round($statisticsState.snapshot.weeklyDelta * 100)}%
					</span>
				</p>
				<p class="text-sm">Most consistent: {$statisticsState.snapshot.mostConsistent ?? '—'}</p>
				<p class="text-sm">Needs attention: {$statisticsState.snapshot.needsAttention ?? '—'}</p>
			</section>
		{/if}

		<!-- Habit trends -->
		<section class="space-y-3">
			<h3 class="font-medium">Habit trends</h3>

			{#if $statisticsState.trends.length === 0}
				<p class="text-sm text-gray-500">No trends available</p>
			{:else}
				<ul class="space-y-2">
					{#each $statisticsState.trends as trend}
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
			{#each $statisticsState.activity as item}
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

<!-- code section from main atm to avoid conflicts----------------------->
<div class="statistic-view flex flex-col items-center p-7 max-w-[1000px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start mb-6 sm:mb-10">Habit Stats</h3>
	<!-- statistics -->
	<div class="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:max-w-[1000px] w-full m-auto">
		{#each panels as panel (panel.key)}
			<StatPanel
				title={panel.title}
				stats={panel.stats}
				selectedDate={panel.key === 'daily'
					? selectedDateForDaily
					: panel.key === 'weekly'
						? selectedDateForWeekly
						: selectedDateForMonthly}
				onDateChange={panel.onChange}
				viewHeight={viewHeight[panel.key]}
				onHeightChange={(height: any) => (viewHeight[panel.key] = height)}
				isDragging={isDragging[panel.key]}
				onDragStateChange={(dragging: any) => (isDragging[panel.key] = dragging)}
				target={panel.key}
			/>
		{/each}
	</div>
</div>
<!-- code section from main atm to avoid conflicts----------------------->
