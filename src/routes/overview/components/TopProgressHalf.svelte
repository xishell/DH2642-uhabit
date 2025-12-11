<script lang="ts">
	import type { HabitWithStatus } from '$lib/types/habit';

	let {
		single = [],
		progressive = []
	}: {
		single?: HabitWithStatus[];
		progressive?: HabitWithStatus[];
	} = $props();

	const total = $derived(single.length + progressive.length);
	const done = $derived(
		single.filter((s) => s.isCompleted).length +
			progressive.filter((p) => p.progress >= (p.habit.targetAmount ?? 0)).length
	);
	const pct = $derived(total === 0 ? 0 : Math.round((done / total) * 100));

	// SVG dimensions and calculations
	const size = 96; // matches w-24 h-24 (24 * 4 = 96px)
	const strokeWidth = 8;
	const radius = (size - strokeWidth) / 2;
	const circumference = Math.PI * radius; // Half circle circumference
	const offset = $derived(circumference - (pct / 100) * circumference);

	// SVG path for semicircle (180 degrees)
	const arcPath = `
		M ${strokeWidth / 2} ${size / 2}
		A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}
	`;
</script>

<div class="mb-6 flex justify-center">
	<div class="bg-surface-900 py-6 px-6 rounded-xl flex items-center gap-8 shadow w-full max-w-2xl">
		<!-- Half Circle Progress -->
		<div
			class="flex-shrink-0 relative"
			style="width: {size}px; height: {size / 2 + strokeWidth}px;"
		>
			<svg
				viewBox="0 0 {size} {size / 2 + strokeWidth}"
				class="half-circle-svg"
				style="width: 100%; height: 100%;"
			>
				<!-- Background arc -->
				<path
					d={arcPath}
					fill="none"
					class="stroke-surface-700"
					stroke-width={strokeWidth}
					stroke-linecap="round"
				/>

				<!-- Progress arc -->
				<path
					d={arcPath}
					fill="none"
					class="stroke-primary-400"
					stroke-width={strokeWidth}
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={offset}
					style="transition: stroke-dashoffset 0.5s ease;"
				/>
			</svg>

			<!-- Percentage text positioned at center bottom -->
			<div
				class="absolute inset-x-0 bottom-0 flex items-center justify-center text-lg font-semibold text-surface-50"
			>
				{pct}%
			</div>
		</div>

		<!-- Progress Details -->
		<div class="flex flex-col justify-center">
			<div class="text-sm text-surface-400">Total progress</div>
			<div class="text-lg font-medium text-surface-50">{pct}% completed</div>
			<div class="mt-2 text-xs text-surface-400">{done} of {total} done</div>
		</div>
	</div>
</div>

<style>
	.half-circle-svg {
		transform: scaleY(-1); /* Flip vertical to make arc curve upward */
	}
</style>
