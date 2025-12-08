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

<div class="mb-4">
	<div class="bg-white p-4 rounded-xl flex items-center gap-6 shadow">
		<!-- Progress Circle -->
		<Progress value={pct} max={100} class="flex-shrink-0 relative w-16 h-16">
			<Progress.Circle>
				<Progress.CircleTrack />
				<Progress.CircleRange />
			</Progress.Circle>
			<Progress.ValueText
				class="absolute inset-0 flex items-center justify-center text-sm font-medium"
			>
				{pct}%
			</Progress.ValueText>
		</Progress>

		<!-- Progress Details -->
		<div>
			<div class="text-sm text-surface-500">Total progress</div>
			<div class="text-lg font-medium">{pct}% completed</div>
			<div class="mt-2 text-xs text-surface-600">{done} of {total} done</div>
		</div>
	</div>
</div>
