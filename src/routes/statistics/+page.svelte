<script lang="ts">
	import DatePicker from './components/DatePicker.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';

	// Types
	type Habit = {
		habitTitle: string;
		completionRate: number;
	};

	type HabitStat = {
		date: string;
		data: Habit[];
	};

	type HabitType = 'daily' | 'weekly' | 'monthly';

	// Helper function to format DateValue to string (YYYY-MM-DD)
	function formatDateValue(dateValue: DateValue): string {
		const year = dateValue.year;
		const month = String(dateValue.month).padStart(2, '0');
		const day = String(dateValue.day).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Helper function to get data by date
	function getDataByDate(stats: HabitStat[], targetDate: string): Habit[] {
		const entry = stats.find((item) => item.date === targetDate);
		return entry ? entry.data : [];
	}

	// Mock data
	const dailyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'meditation', completionRate: 0.1 },
				{ habitTitle: 'journaling', completionRate: 0.4 },
				{ habitTitle: 'coding', completionRate: 0.34 },
				{ habitTitle: 'walking', completionRate: 0.4 },
				{ habitTitle: 'stretching', completionRate: 0.52 },
				{ habitTitle: 'reading news', completionRate: 0.14 },
				{ habitTitle: 'language study', completionRate: 0.04 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.6 },
				{ habitTitle: 'drink water', completionRate: 0.95 },
				{ habitTitle: 'work out', completionRate: 0.7 },
				{ habitTitle: 'meditation', completionRate: 0.3 }
			]
		}
	];

	const weeklyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.75 },
				{ habitTitle: 'drink water', completionRate: 0.85 },
				{ habitTitle: 'work out', completionRate: 0.5 },
				{ habitTitle: 'meditation', completionRate: 0.25 },
				{ habitTitle: 'journaling', completionRate: 0.6 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.7 },
				{ habitTitle: 'drink water', completionRate: 0.88 },
				{ habitTitle: 'work out', completionRate: 0.45 }
			]
		}
	];

	const monthlyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.65 },
				{ habitTitle: 'drink water', completionRate: 0.82 },
				{ habitTitle: 'work out', completionRate: 0.38 },
				{ habitTitle: 'meditation', completionRate: 0.2 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.72 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.55 },
				{ habitTitle: 'meditation', completionRate: 0.35 },
				{ habitTitle: 'journaling', completionRate: 0.48 }
			]
		}
	];

	// DatePicker selected dates (using $state for Svelte 5 reactivity)
	let selectedDateForDaily = $state('2025-11-20');
	let selectedDateForWeekly = $state('2025-11-20');
	let selectedDateForMonthly = $state('2025-11-20');

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

	// Resizable view configuration
	const minHeight = 16;
	const maxHeight = 520; // max-h-130 = 130 * 4 = 520px

	let viewHeight = $state({ daily: 180, weekly: 180, monthly: 180 });
	let isDragging = $state({ daily: false, weekly: false, monthly: false });

	function draggable(node: HTMLElement, targetView: HabitType) {
		let active = false;

		function onMouseDown(event: MouseEvent) {
			event.preventDefault();
			active = true;
			isDragging[targetView] = true;
			window.addEventListener('mousemove', onMouseMove);
			window.addEventListener('mouseup', onMouseUp);
		}

		function onTouchStart(event: TouchEvent) {
			event.preventDefault();
			active = true;
			isDragging[targetView] = true;
			window.addEventListener('touchmove', onTouchMove, { passive: false });
			window.addEventListener('touchend', onTouchEnd);
		}

		function onMouseMove(event: MouseEvent) {
			if (!active) return;
			updateHeight(event.clientY, targetView);
		}

		function onTouchMove(event: TouchEvent) {
			if (!active) return;
			event.preventDefault();
			updateHeight(event.touches[0].clientY, targetView);
		}

		function onMouseUp() {
			active = false;
			isDragging[targetView] = false;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		}

		function onTouchEnd() {
			active = false;
			isDragging[targetView] = false;
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
		}

		function updateHeight(clientY: number, view: HabitType) {
			const divEl = document.getElementById(`resizable-${view}`);
			if (!divEl) return;
			const divTop = divEl.getBoundingClientRect().top;
			const newHeight = Math.min(Math.max(clientY - divTop, minHeight), maxHeight);
			viewHeight[view] = newHeight;
		}

		node.addEventListener('mousedown', onMouseDown);
		node.addEventListener('touchstart', onTouchStart, { passive: false });

		return {
			destroy() {
				node.removeEventListener('mousedown', onMouseDown);
				node.removeEventListener('touchstart', onTouchStart);
			}
		};
	}
</script>

<div class="statistic-view flex flex-col items-center p-7 max-w-[1000px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start mb-6 sm:mb-10">Habit Stats</h3>
	<!-- statistics -->
	<div class="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:max-w-[1000px] w-full m-auto">
		<!-- daily -->
		<div class="stat-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Daily</span>
				<DatePicker onchange={handleDailyDateChange} />
			</div>
			<div class="relative">
				<div
					id="resizable-daily"
					style="height:{viewHeight.daily}px"
					class="max-h-130 min-h-4 scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto"
				>
					<div class="absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each getDataByDate(dailyHabitStats, selectedDateForDaily) as habit}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habit.completionRate * 100}%"
							>
								{habit.habitTitle}
							</div>
						</div>
					{/each}
				</div>
				<div
					use:draggable={'daily'}
					class="absolute bottom-0 left-1 right-1 h-3 cursor-row-resize rounded-2xl
					bg-white/10 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
					{isDragging.daily ? 'opacity-100' : 'opacity-50'} hover:opacity-100"
				></div>
			</div>
		</div>

		<!-- weekly -->
		<div class="stat-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Weekly</span>
				<DatePicker onchange={handleWeeklyDateChange} />
			</div>
			<div class="relative">
				<div
					id="resizable-weekly"
					style="height:{viewHeight.weekly}px"
					class="max-h-130 min-h-4 scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto"
				>
					<div class="absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each getDataByDate(weeklyHabitStats, selectedDateForWeekly) as habit}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habit.completionRate * 100}%"
							>
								{habit.habitTitle}
							</div>
						</div>
					{/each}
				</div>
				<div
					use:draggable={'weekly'}
					class="absolute bottom-0 left-1 right-1 h-3 cursor-row-resize rounded-2xl
					bg-white/10 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
					{isDragging.weekly ? 'opacity-100' : 'opacity-50'} hover:opacity-100"
				></div>
			</div>
		</div>

		<!-- monthly -->
		<div class="stat-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Monthly</span>
				<DatePicker onchange={handleMonthlyDateChange} />
			</div>
			<div class="relative">
				<div
					id="resizable-monthly"
					style="height:{viewHeight.monthly}px"
					class="max-h-130 min-h-4 scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto"
				>
					<div class="absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each getDataByDate(monthlyHabitStats, selectedDateForMonthly) as habit}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habit.completionRate * 100}%"
							>
								{habit.habitTitle}
							</div>
						</div>
					{/each}
				</div>
				<div
					use:draggable={'monthly'}
					class="absolute bottom-0 left-1 right-1 h-3 cursor-row-resize rounded-2xl
					bg-white/10 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
					{isDragging.monthly ? 'opacity-100' : 'opacity-50'} hover:opacity-100"
				></div>
			</div>
		</div>
	</div>
</div>

<style>
	.scrollbar-ctn::-webkit-scrollbar {
		width: 26px;
	}

	.scrollbar-ctn::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-ctn::-webkit-scrollbar-thumb {
		width: 0px;
		background-color: #f4f4f4a8;
		background-clip: content-box;
		border-radius: 99px;
		border: 10px solid transparent;
	}
</style>
