<script lang="ts">
	import DatePicker from './DatePicker.svelte';
	import { dragResize } from '$lib/actions/dragResize';
	import type { DateValue } from '@skeletonlabs/skeleton-svelte';
	import type { HabitStat, HabitType } from '../types';

	let {
		title,
		stats,
		selectedDate,
		onDateChange,
		viewHeight,
		onHeightChange,
		isDragging,
		onDragStateChange,
		target
	}: {
		title: string;
		stats: HabitStat[];
		selectedDate: string;
		onDateChange: (value: DateValue[]) => void;
		viewHeight: number;
		onHeightChange: (height: number) => void;
		isDragging: boolean;
		onDragStateChange: (dragging: boolean) => void;
		target: HabitType;
	} = $props();

	const getDataByDate = (data: HabitStat[], date: string) =>
		data.find((item) => item.date === date)?.data ?? [];

	const resizeOptions = $derived({
		targetId: `resizable-${target}`,
		minHeight: 16,
		maxHeight: 520,
		onHeightChange,
		onDragStateChange
	});
</script>

<div class="stat-view flex flex-col gap-2 relative">
	<div class="view-tab flex justify-between items-center">
		<span class="text-xl">{title}</span>
		<DatePicker onchange={onDateChange} />
	</div>
	<div class="relative">
		<div
			id={`resizable-${target}`}
			style={`height:${viewHeight}px`}
			class="max-h-130 min-h-4 scrollbar-ctn rounded-xl border border-primary-500 bg-primary-900 pl-6 pr-8 overflow-x-hidden overflow-y-auto"
		>
			<div class="absolute left-6 top-0 w-1 h-full bg-primary-500"></div>

			{#each getDataByDate(stats, selectedDate) as habit (habit.habitTitle)}
				<div class="w-full h-6 border border-primary-500 my-4 rounded-r-[10px]">
					<div
						class="h-full bg-primary-500 rounded-r-[10px] pl-2 text-primary-50 text-sm flex items-center whitespace-nowrap"
						style={`width:${habit.completionRate * 100}%`}
					>
						{habit.habitTitle}
					</div>
				</div>
			{/each}
		</div>
		<div
			use:dragResize={resizeOptions}
			class="absolute bottom-0 left-1 right-1 h-3 cursor-row-resize rounded-2xl
					bg-surface-50/10 dark:bg-surface-900/10 backdrop-blur-md shadow-lg transition-opacity duration-200
					{isDragging ? 'opacity-100' : 'opacity-50'} hover:opacity-100"
		></div>
	</div>
</div>

<style>
	:global(.scrollbar-ctn::-webkit-scrollbar) {
		width: 26px;
	}

	:global(.scrollbar-ctn::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.scrollbar-ctn::-webkit-scrollbar-thumb) {
		width: 0px;
		background-color: rgb(var(--color-surface-400) / 0.66);
		background-clip: content-box;
		border-radius: 99px;
		border: 10px solid transparent;
	}
</style>
