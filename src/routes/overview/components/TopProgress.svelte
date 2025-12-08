<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let single: HabitWithStatus[] = [];
	export let progressive: HabitWithStatus[] = [];

	$: total = single.length + progressive.length;
	$: done =
		single.filter((s) => s.isCompleted).length +
		progressive.filter((p) => p.progress >= (p.habit.targetAmount ?? 0)).length;
	$: pct = total === 0 ? 0 : Math.round((done / total) * 100);
</script>

<div class="mb-6 flex justify-center">
	<div class="bg-surface-900 py-6 px-6 rounded-xl flex items-center gap-8 shadow w-full max-w-2xl">
		<!-- Progress Circle -->
		<Progress value={pct} max={100} class="flex-shrink-0 relative w-24 h-24">
			<Progress.Circle>
				<Progress.CircleTrack class="stroke-surface-700" />
				<Progress.CircleRange class="stroke-primary-400" />
			</Progress.Circle>
			<Progress.ValueText
				class="absolute inset-0 flex items-center justify-center text-lg font-semibold text-surface-50"
			>
				{pct}%
			</Progress.ValueText>
		</Progress>

		<!-- Progress Details -->
		<div class="flex flex-col justify-center">
			<div class="text-sm text-surface-400">Total progress</div>
			<div class="text-lg font-medium text-surface-50">{pct}% completed</div>
			<div class="mt-2 text-xs text-surface-400">{done} of {total} done</div>
		</div>
	</div>
</div>
