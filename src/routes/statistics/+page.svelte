<script lang="ts">
	import StatPanel from './components/StatPanel.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';
	import type { HabitStat, HabitType } from './types';

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
</script>

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
				onHeightChange={(height) => (viewHeight[panel.key] = height)}
				isDragging={isDragging[panel.key]}
				onDragStateChange={(dragging) => (isDragging[panel.key] = dragging)}
				target={panel.key}
			/>
		{/each}
	</div>
</div>
