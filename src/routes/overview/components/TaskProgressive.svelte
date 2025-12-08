<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let p: HabitWithStatus;
	export let single: HabitWithStatus[] = [];
	export let progressive: HabitWithStatus[] = [];

	export let onOpen: () => void = () => {};
	export const onChange: (delta: number) => void = () => {};

	// Individual task percent
	$: pctTask =
		(p.habit.targetAmount ?? 0) > 0
			? Math.min(100, Math.round((p.progress / (p.habit.targetAmount ?? 1)) * 100))
			: 0;

	// Total progress percent
	$: total = single.length + progressive.length;
	$: done =
		single.filter((s) => s.isCompleted).length +
		progressive.filter((p) => p.progress >= (p.habit.targetAmount ?? 0)).length;
	$: pctTotal = total === 0 ? 0 : Math.round((done / total) * 100);

	function handleClick() {
		onOpen?.();
	}
</script>

<button
	type="button"
	aria-label={`Open ${p.habit.title}`}
	on:click={handleClick}
	class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-2 w-full text-left"
>
	<!-- Top Progress Card -->

	<div class="mb-6 flex justify-center">
		<div
			class="bg-surface-900 py-6 px-6 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-8 shadow w-full max-w-2xl"
		>
			<!-- Progress Circle -->
			<Progress value={pctTotal} max={100} class="flex-shrink-0 relative w-24 h-24">
				<Progress.Circle>
					<Progress.CircleTrack class="stroke-surface-700" />
					<Progress.CircleRange class="stroke-primary-400" />
				</Progress.Circle>
				<Progress.ValueText
					class="absolute inset-0 flex items-center justify-center text-lg font-semibold text-surface-50"
				>
					{pctTotal}%
				</Progress.ValueText>
			</Progress>

			<!-- Progress Details -->
			<div
				class="flex flex-col items-center sm:items-start justify-center text-center sm:text-left"
			>
				<div class="text-sm text-surface-400">Total progress</div>
				<div class="text-lg font-medium text-surface-50">{pctTotal}% completed</div>
				<div class="mt-2 text-xs text-surface-400">{done} of {total} done</div>
			</div>
		</div>
	</div>

	<!-- Skeleton Linear Progress -->
	<Progress value={pctTotal} max={100} class="h-2 rounded-full">
		<Progress.Label class="sr-only" />
		<Progress.ValueText class="sr-only" />
	</Progress>
</button>
