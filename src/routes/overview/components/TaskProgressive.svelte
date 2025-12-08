<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let p: HabitWithStatus;
	export let onOpen: () => void = () => {};

	$: target = p.habit.targetAmount ?? 0;
	$: pct = target > 0 ? Math.min(100, Math.round((p.progress / target) * 100)) : 0;
	$: isCompleted = p.progress >= target && target > 0;
</script>

<button
	type="button"
	aria-label={`Open ${p.habit.title}`}
	on:click={onOpen}
	class="bg-surface rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3 w-full text-left"
>
	<div class="flex items-center justify-between">
		<div
			class="text-sm font-medium transition"
			class:line-through={isCompleted}
			class:text-surface-400={isCompleted}
		>
			{p.habit.title}
		</div>
		<div class="text-xs text-surface-500">
			{p.progress} / {target} {p.habit.unit ?? ''}
		</div>
	</div>

	<Progress value={pct} max={100} class="h-2 rounded-full">
		<Progress.Track class="bg-surface-200">
			<Progress.Range class={isCompleted ? 'bg-violet-600' : 'bg-primary-500'} />
		</Progress.Track>
	</Progress>
</button>
