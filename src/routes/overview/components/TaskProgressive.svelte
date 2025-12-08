<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let p: HabitWithStatus;

	export let onOpen: () => void = () => {};
	export const onChange: (delta: number) => void = () => {};

	$: pct =
		(p.habit.targetAmount ?? 0) > 0
			? Math.min(100, Math.round((p.progress / (p.habit.targetAmount ?? 1)) * 100))
			: 0;

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
	<div class="flex items-center justify-between">
		<div class="font-medium text-sm">{p.habit.title}</div>
		<div class="text-xs text-surface-500">{p.progress}/{p.habit.targetAmount ?? 0}</div>
	</div>

	<!-- Skeleton UI v4 Linear Progress -->
	<Progress value={pct} max={100} class="h-2 rounded-full">
		<Progress.Label class="sr-only" />
		<Progress.ValueText class="sr-only" />
	</Progress>
</button>
