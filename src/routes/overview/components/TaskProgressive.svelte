<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { Check } from 'lucide-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	let {
		p,
		onOpen = () => {},
		onToggleComplete = () => {}
	}: {
		p: HabitWithStatus;
		onOpen?: () => void;
		onToggleComplete?: () => void;
	} = $props();

	const target = $derived(p.habit.targetAmount ?? 0);
	const pct = $derived(target > 0 ? Math.min(100, Math.round((p.progress / target) * 100)) : 0);
	const isCompleted = $derived(p.progress >= target && target > 0);
</script>

<button
	type="button"
	aria-label={`Open ${p.habit.title}`}
	onclick={onOpen}
	class="bg-surface rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3 w-full text-left"
>
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-3 flex-1">
			<div
				role="button"
				tabindex="0"
				class="w-5 h-5 rounded-full flex items-center justify-center border-2 transition border-surface-500"
				class:border-violet-600={isCompleted}
				class:bg-violet-600={isCompleted}
				onclick={(e) => {
					e.stopPropagation();
					onToggleComplete();
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						onToggleComplete();
					}
				}}
				aria-pressed={isCompleted}
				aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
			>
				{#if isCompleted}
					<Check class="w-3 h-3 text-white" />
				{/if}
			</div>
			<div
				class="text-sm font-medium transition"
				class:line-through={isCompleted}
				class:text-surface-400={isCompleted}
			>
				{p.habit.title}
			</div>
		</div>
		<div class="text-xs text-surface-500 text-right">
			{p.progress} / {target}
			{p.habit.unit ?? ''}
		</div>
	</div>

	<Progress value={pct} max={100} class="h-2 rounded-full">
		<Progress.Track class="bg-surface-200">
			<Progress.Range class={isCompleted ? 'bg-violet-600' : 'bg-primary-500'} />
		</Progress.Track>
	</Progress>
</button>
