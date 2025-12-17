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

	//dependencies for the new UI>>>>>>>>>>>>>>>>>
	import { DatePicker, Portal, SegmentedControl, Progress } from '@skeletonlabs/skeleton-svelte';
	import TrendingCard from './components/TrendingCard.svelte';
	import PeriodCard from './components/PeriodCard.svelte';
	import MomentumCard from './components/MomentumCard.svelte';
	import HeatmapCard from './components/HeatmapCard.svelte';
	let value = $state<string | null>('music');
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

<!-- purely UI (new version) -------------------------------------------->
<div class="statistic-view flex flex-col gap-6 items-center p-7 max-w-[1000px] m-auto">
	<!-- header & controls -->
	<div
		class="w-full flex flex-col gap-6 sm:gap-0 sm:flex-row sm:justify-between items-center sm:items-start"
	>
		<div class="flex w-full justify-between gap-4">
			<div class="title-ctn flex flex-col items-start">
				<h3 class="text-2xl">Statistics</h3>
				<h3 class="text-sm text-surface-400">Snapshot of how your habits are trending</h3>
			</div>

			<DatePicker>
				<DatePicker.Label class="text-surface-400">Date Flag</DatePicker.Label>
				<DatePicker.Control class="h-12 ">
					<DatePicker.Input
						placeholder="MM/DD/YYYY"
						class="h-full rounded-full border border-surface-500 pt-1 align-middle text-sm placeholder:text-sm"
					/>
					<DatePicker.Trigger class="mt-[5px] mr-1 w-4 h-4 rounded-full" />
				</DatePicker.Control>
				<Portal>
					<DatePicker.Positioner>
						<DatePicker.Content>
							<DatePicker.View view="day">
								<DatePicker.Context>
									{#snippet children(datePicker)}
										<DatePicker.ViewControl>
											<DatePicker.PrevTrigger />
											<DatePicker.ViewTrigger>
												<DatePicker.RangeText />
											</DatePicker.ViewTrigger>
											<DatePicker.NextTrigger />
										</DatePicker.ViewControl>
										<DatePicker.Table>
											<DatePicker.TableHead>
												<DatePicker.TableRow>
													{#each datePicker().weekDays as weekDay, id (id)}
														<DatePicker.TableHeader>{weekDay.short}</DatePicker.TableHeader>
													{/each}
												</DatePicker.TableRow>
											</DatePicker.TableHead>
											<DatePicker.TableBody>
												{#each datePicker().weeks as week, id (id)}
													<DatePicker.TableRow>
														{#each week as day, id (id)}
															<DatePicker.TableCell value={day}>
																<DatePicker.TableCellTrigger>{day.day}</DatePicker.TableCellTrigger>
															</DatePicker.TableCell>
														{/each}
													</DatePicker.TableRow>
												{/each}
											</DatePicker.TableBody>
										</DatePicker.Table>
									{/snippet}
								</DatePicker.Context>
							</DatePicker.View>
							<DatePicker.View view="month">
								<DatePicker.Context>
									{#snippet children(datePicker)}
										<DatePicker.ViewControl>
											<DatePicker.PrevTrigger />
											<DatePicker.ViewTrigger>
												<DatePicker.RangeText />
											</DatePicker.ViewTrigger>
											<DatePicker.NextTrigger />
										</DatePicker.ViewControl>
										<DatePicker.Table>
											<DatePicker.TableBody>
												{#each datePicker().getMonthsGrid( { columns: 4, format: 'short' } ) as months, id (id)}
													<DatePicker.TableRow>
														{#each months as month, id (id)}
															<DatePicker.TableCell value={month.value}>
																<DatePicker.TableCellTrigger
																	>{month.label}</DatePicker.TableCellTrigger
																>
															</DatePicker.TableCell>
														{/each}
													</DatePicker.TableRow>
												{/each}
											</DatePicker.TableBody>
										</DatePicker.Table>
									{/snippet}
								</DatePicker.Context>
							</DatePicker.View>
							<DatePicker.View view="year">
								<DatePicker.Context>
									{#snippet children(datePicker)}
										<DatePicker.ViewControl>
											<DatePicker.PrevTrigger />
											<DatePicker.ViewTrigger>
												<DatePicker.RangeText />
											</DatePicker.ViewTrigger>
											<DatePicker.NextTrigger />
										</DatePicker.ViewControl>
										<DatePicker.Table>
											<DatePicker.TableBody>
												{#each datePicker().getYearsGrid({ columns: 4 }) as years, id (id)}
													<DatePicker.TableRow>
														{#each years as year, id (id)}
															<DatePicker.TableCell value={year.value}>
																<DatePicker.TableCellTrigger
																	>{year.label}</DatePicker.TableCellTrigger
																>
															</DatePicker.TableCell>
														{/each}
													</DatePicker.TableRow>
												{/each}
											</DatePicker.TableBody>
										</DatePicker.Table>
									{/snippet}
								</DatePicker.Context>
							</DatePicker.View>
						</DatePicker.Content>
					</DatePicker.Positioner>
				</Portal>
			</DatePicker>
		</div>

		<SegmentedControl
			{value}
			onValueChange={(details) => (value = details.value)}
			class="sm:ml-10 max-w-80"
		>
			<SegmentedControl.Label class="text-surface-400 ">Range</SegmentedControl.Label>
			<SegmentedControl.Control
				class="h-12 text-sm p-[5px] rounded-full border border-surface-700 inline-flex gap-2 bg-surface-800"
			>
				<SegmentedControl.Indicator class=" bg-violet-600 duration-200 rounded-full " />
				<SegmentedControl.Item value="daily">
					<SegmentedControl.ItemText class="text-white data-[state=checked]:text-white text-sm"
						>Daily</SegmentedControl.ItemText
					>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="weekly">
					<SegmentedControl.ItemText class="text-white data-[state=checked]:text-white text-sm"
						>Weekly</SegmentedControl.ItemText
					>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="monthly">
					<SegmentedControl.ItemText class="text-white data-[state=checked]:text-white text-sm"
						>Monthly</SegmentedControl.ItemText
					>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
			</SegmentedControl.Control>
		</SegmentedControl>
	</div>

	<!-- snapshot view -->
	<div class="grid grid-cols-2 sm:grid-cols-4 w-full gap-4">
		<div class="snapshot-card flex flex-col gap-1 w-full p-4 border border-primary-600 rounded-xl">
			<div class="card-title text-xs text-surface-400">CURRENT STREAK</div>
			<div class="data text-2xl font-semibold text-surface-40">12 days</div>
			<div class="extra-info text-xs text-surface-400">Longest 19 · Active 12</div>
		</div>
		<div class="snapshot-card flex flex-col gap-1 w-full p-4 border border-primary-600 rounded-xl">
			<div class="card-title text-xs text-surface-400">OVERALL COMPLETION</div>
			<div class="flex gap-2 items-baseline">
				<div class="data text-2xl font-semibold text-surface-40">78%</div>
				<div class="delt text-sm">6%</div>
			</div>
			<div class="extra-info text-xs text-surface-400"></div>
		</div>
		<div class="snapshot-card flex flex-col gap-1 w-full p-4 border border-primary-600 rounded-xl">
			<div class="card-title text-xs text-surface-400">MOST CONSISTENT</div>
			<div class="data text-xl text-surface-40">Drink water</div>
			<div class="extra-info text-xs text-surface-400">Locked in -- keep it rolling</div>
		</div>
		<div class="snapshot-card flex flex-col gap-1 w-full p-4 border border-primary-600 rounded-xl">
			<div class="card-title text-xs text-surface-400">NEEDS ATTENTION</div>
			<div class="data text-xl text-surface-40">Stretching</div>
			<div class="extra-info text-xs text-surface-400">Focus here this week</div>
		</div>
	</div>

	<div class="flex w-full flex-col gap-6 sm:flex-row-reverse justify-between">
		<!-- trending view -->
		<div
			class="trending-view flex flex-col gap-3 w-full sm:w-78 sm:h-full p-4 pb-0 border border-surface-600 rounded-xl"
		>
			<div class="flex justify-between items-baseline">
				<div>Top habits this daily</div>
				<div class="text-xs text-surface-400">vs previous period</div>
			</div>

			<div
				class="scroll-view overflow-x-auto overflow-y-hidden touch-pan-x scroll-smooth -mx-4 px-4 sm:overflow-x-hidden sm:overflow-y-auto sm:touch-pan-y sm:mx-0 sm:px-0 sm:h-100"
				style="scrollbar-width: none; -ms-overflow-style: none;"
			>
				<div class="flex gap-3 flex-nowrap sm:flex-col sm:flex-wrap">
					<TrendingCard title="Drink water" delta={3} progress={94} streak={18} />
					<TrendingCard title="Stretching" delta={-2} progress={61} streak={7} />
					<TrendingCard title="Reading" delta={5} progress={82} streak={23} />
					<TrendingCard title="Working out" delta={6} progress={70} streak={2} />
					<TrendingCard title="Working out" delta={6} progress={70} streak={2} />
					<TrendingCard title="Working out" delta={6} progress={70} streak={2} />
				</div>
			</div>
		</div>
		<!-- period view -->
		<div class="flex-flex-col">
			<!-- period view snapshots -->
			<div
				class="trending-view flex flex-col flex-1 gap-3 sm:h-full p-4 border border-surface-600 rounded-xl"
			>
				<div class="flex justify-between items-baseline">
					<div class="text-lg font-semibold">Today (Nov 21)</div>
					<div class="text-sm text-surface-400">Updated 5m ago</div>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
					<PeriodCard title="Completion" contents={'82%'} />
					<PeriodCard title="Completions" contents={'14'} />
					<PeriodCard title="Best day" contents={'Tue'} />
					<PeriodCard title="Streak" contents={'12(best 19)'} />
				</div>

				<div class="flex flex-col gap-3 sm:flex-row">
					<!--recent momentum -->
					<MomentumCard data={[60, 80, 100, 100, 80, 90, 90]} />

					<!--consistency heatmap -->
					<HeatmapCard
						data={[1, 2, 3, 4, 1, 3, 4, 0, 0, 1, 4, 1, 3, 4, 0, 0, 1, 4, 1, 3, 4, 0, 0, 1, 2, 3, 4]}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
