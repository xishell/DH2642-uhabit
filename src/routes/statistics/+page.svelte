<script lang="ts">
	import DatePicker from './components/DatePicker.svelte';
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
	const dailyHabitStats = [
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
	const weeklyHabitStats = [
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
	const monthlyHabitStats = [
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

	//resizable view
	let heightDaily = 180;
	let heightWeekly = 180;
	let heightMonthly = 180;
	let dragging = false;

	function startDrag(tartgetView: string) {
		dragging = true;

		const onMove = (event: MouseEvent | TouchEvent) => {
			if (!dragging) return;

			let clientY: number = 0;
			if (event instanceof MouseEvent) {
				clientY = event.clientY;
			} else if (event instanceof TouchEvent) {
				clientY = event.touches[0].clientY;
			}

			if (tartgetView === 'daily') {
				const divEl = document.getElementById('resizable-daily')!;
				const divTop = divEl.getBoundingClientRect().top;
				heightDaily = clientY - divTop;
			} else if (tartgetView === 'weekly') {
				const divEl = document.getElementById('resizable-weekly')!;
				const divTop = divEl.getBoundingClientRect().top;
				heightWeekly = clientY - divTop;
			} else if (tartgetView === 'monthly') {
				const divEl = document.getElementById('resizable-monthly')!;
				const divTop = divEl.getBoundingClientRect().top;
				heightMonthly = clientY - divTop;
			}
		};

		const stopDrag = () => {
			dragging = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', stopDrag);
			window.removeEventListener('touchmove', onMove);
			window.removeEventListener('touchend', stopDrag);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', stopDrag);
		window.addEventListener('touchmove', onMove);
		window.addEventListener('touchend', stopDrag);
	}

	// datePicker Values
	//-----------?????-----------
	//have dificulties in get props from childcomponents <DatePickers=>
	//-----------?????-----------
	let selectedDates: Date[] = [];
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
				<DatePicker />
			</div>
			<div class="relative">
				<div
					id="resizable-daily"
					style="height:{heightDaily}px"
					class="  scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-y-auto"
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
						on:mousedown={() => startDrag('daily')}
						on:touchstart={() => startDrag('daily')}
						class="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-tranparent"
					></div>
				</div>
			</div>
			<p>{selectedDates}</p>
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
					style="height:{heightWeekly}px"
					class="  scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-y-auto"
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
						on:mousedown={() => startDrag('weekly')}
						on:touchstart={() => startDrag('weekly')}
						class="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-tranparent"
					></div>
				</div>
			</div>
			<p>{selectedDates}</p>
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
					style="height:{heightMonthly}px"
					class="  scrollbar-ctn rounded-[10px] border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-y-auto"
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
						on:mousedown={() => startDrag('monthly')}
						on:touchstart={() => startDrag('monthly')}
						class="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-tranparent"
					></div>
				</div>
			</div>
			<p>{selectedDates}</p>
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
