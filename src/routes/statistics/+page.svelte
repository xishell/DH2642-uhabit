<script lang="ts">
	import DatePicker from './components/DatePicker.svelte';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';

	//data
	type Habit = {
		habitTitle: string;
		completionRate: number;
	};

	type HabitStat = {
		date: string;
		data: Habit[];
	};
	const dailyHabitCompletionArr = [
		{ habitTitle: 'read books', completionRate: 0.8 },
		{ habitTitle: 'drink water', completionRate: 0.9 },
		{ habitTitle: 'work out', completionRate: 0.4 },
		{ habitTitle: 'work out', completionRate: 0.1 },
		{ habitTitle: 'work out', completionRate: 0.4 },
		{ habitTitle: 'work out', completionRate: 0.34 },
		{ habitTitle: 'work out', completionRate: 0.4 },
		{ habitTitle: 'work out', completionRate: 0.52 },
		{ habitTitle: 'work out', completionRate: 0.14 },
		{ habitTitle: 'work out', completionRate: 0.04 }
	];
	function getDataByDate(stats: HabitStat[], targetDate: string): Habit[] {
		const entry = stats.find((item) => item.date === targetDate);
		return entry ? entry.data : [];
	}
	const dailyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		}
	];

	//for weekly and monthly stats, "date" means the last day of a week or month period
	//so user only choose one day for each stats view

	const weeklyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		}
	];
	const monthlyHabitStats: HabitStat[] = [
		{
			date: '2025-11-20',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		},
		{
			date: '2025-11-21',
			data: [
				{ habitTitle: 'read books', completionRate: 0.8 },
				{ habitTitle: 'drink water', completionRate: 0.9 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.1 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.34 },
				{ habitTitle: 'work out', completionRate: 0.4 },
				{ habitTitle: 'work out', completionRate: 0.52 },
				{ habitTitle: 'work out', completionRate: 0.14 },
				{ habitTitle: 'work out', completionRate: 0.04 }
			]
		}
	];
	// datePicker Values
	//-----------?????-----------
	//have dificulties in get props from childcomponents <DatePickers=>
	//12.12 tried dispatch events from DatePicker, got a lot of type errors, NEED HELP >_<
	//-----------?????-----------
	let selectedDateForDaily: '2025-11-20';
	let selectedDateForWeekly: '2025-11-21';
	let selectedDateForMonthly: '2025-11-20';

	//resizable view
	const minHeight = 16;
	let viewHeight: Record<HabitType, Number> = {
		daily: 180,
		weekly: 180,
		monthly: 180
	};

	let dragging = false;

	type HabitType = 'daily' | 'weekly' | 'monthly';
	let isDragging: Record<HabitType, boolean> = {
		daily: false,
		weekly: false,
		monthly: false
	};

	function startDrag(targetView: HabitType, event: MouseEvent | TouchEvent) {
		dragging = true;

		if (event instanceof TouchEvent) {
			event.preventDefault();
		}

		const onMove = (event: MouseEvent | TouchEvent) => {
			if (!dragging) return;

			let clientY: number = 0;
			if (event instanceof MouseEvent) {
				clientY = event.clientY;
			} else if (event instanceof TouchEvent) {
				event.preventDefault();
				clientY = event.touches[0].clientY;
			}

			isDragging[targetView] = true;
			const divEl = document.getElementById(`resizable-${targetView}`)!;
			const divTop = divEl.getBoundingClientRect().top;
			viewHeight[targetView] = Math.max(clientY - divTop, minHeight);
		};

		const stopDrag = () => {
			dragging = false;
			isDragging['daily'] = false;
			isDragging['weekly'] = false;
			isDragging['monthly'] = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', stopDrag);
			window.removeEventListener('touchmove', onMove as any);
			window.removeEventListener('touchend', stopDrag);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', stopDrag);
		window.addEventListener('touchmove', onMove as any, { passive: false });
		window.addEventListener('touchend', stopDrag);
	}
</script>

<div class="statistic-view flex flex-col items-center p-7 max-w-[1000px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start mb-6 sm:mb-10">Habit Stats</h3>
	<!-- statistics -->
	<div class="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:max-w-[1000px] w-full m-auto">
		<!-- daily -->
		<div class="daily-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Daily</span>
				<!-- <div class="w-16 h-5 rounded-full bg-gray-200"></div> -->
				<DatePicker
					on:change={(e) => {
						selectedDateForDaily =
							e.detail[0].year.toString() + e.detail[0].month + e.detail[0].day;
						console.log(selectedDateForDaily);
					}}
				/>
				<!-- don't know how to get the value here, HELPPPPPP-->
			</div>
			<div class="relative">
				<div
					id="resizable-daily"
					style="height:{viewHeight['daily']}px"
					class={`max-h-130 min-h-[${minHeight}] scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto `}
				>
					<div class=" absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each getDataByDate(dailyHabitStats, selectedDateForDaily) as habitDaily}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habitDaily.completionRate * 100}%"
							>
								{habitDaily.habitTitle}
							</div>
						</div>
					{/each}

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						on:mousedown={(e) => startDrag('daily', e)}
						on:touchstart={(e) => startDrag('daily', e)}
						class={`absolute bottom-px left-1 right-1 h-2 cursor-row-resize rounded-2xl 
						bg-white/4 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
          				${isDragging['daily'] ? 'opacity-100' : 'opacity-0'} hover:opacity-100`}
					></div>
				</div>
			</div>
		</div>
		<!-- weekly -->
		<div class="daily-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Weekly</span>
				<!-- <div class="w-16 h-5 rounded-full bg-gray-200"></div> -->
				<DatePicker />
			</div>
			<div class="relative">
				<div
					id="resizable-weekly"
					style="height:{viewHeight['weekly']}px"
					class={`max-h-130 min-h-[${minHeight}] scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto `}
				>
					<div class=" absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each dailyHabitCompletionArr as habitDaily}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habitDaily.completionRate * 100}%"
							>
								{habitDaily.habitTitle}
							</div>
						</div>
					{/each}

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						on:mousedown={(e) => startDrag('weekly', e)}
						on:touchstart={(e) => startDrag('weekly', e)}
						class={`absolute bottom-px left-1 right-1 h-2 cursor-row-resize rounded-2xl 
						bg-white/4 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
          				${isDragging['weekly'] ? 'opacity-100' : 'opacity-0'} hover:opacity-100`}
					></div>
				</div>
			</div>
		</div>
		<!-- monthly -->
		<div class="daily-view flex flex-col gap-2 relative">
			<div class="view-tab flex justify-between items-center">
				<span class="text-xl">Monthly</span>
				<!-- <div class="w-16 h-5 rounded-full bg-gray-200"></div> -->
				<DatePicker />
			</div>
			<div class="relative">
				<div
					id="resizable-monthly"
					style="height:{viewHeight['monthly']}px"
					class={`max-h-130 min-h-[${minHeight}] scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto `}
				>
					<div class=" absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

					<!-- habit completion bar list -->
					{#each dailyHabitCompletionArr as habitDaily}
						<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
							<div
								class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
								style="width: {habitDaily.completionRate * 100}%"
							>
								{habitDaily.habitTitle}
							</div>
						</div>
					{/each}

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						on:mousedown={(e) => startDrag('monthly', e)}
						on:touchstart={(e) => startDrag('monthly', e)}
						class={`absolute bottom-px left-1 right-1 h-2 cursor-row-resize rounded-2xl 
						bg-white/4 backdrop-blur-md shadow-[0_-5px_20px_rgba(255,200,255,0.2)] transition-opacity duration-200
          				${isDragging['monthly'] ? 'opacity-100' : 'opacity-0'} hover:opacity-100`}
					></div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* .scrollbar-ctn {
		scrollbar-gutter: stable both-edges;
	} */
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
