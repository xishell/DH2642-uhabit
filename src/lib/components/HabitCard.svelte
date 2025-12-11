<script lang="ts">
	import { Edit2, CalendarClock } from 'lucide-svelte';
	import type { Habit } from '$lib/types/habit';

	let {
		habit,
		onedit
	}: {
		habit: Habit;
		onedit?: (habit: Habit) => void;
	} = $props();

	const formatFrequency = (h: Habit) => {
		if (h.frequency === 'daily') return 'Daily';
		if (h.frequency === 'weekly') {
			if (!h.period?.length) return 'Weekly';
			const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			return `Weekly on ${h.period.map((d) => labels[d] || d).join(', ')}`;
		}
		// monthly
		if (!h.period?.length) return 'Monthly';
		const suffix = (n: number) => {
			if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
			if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
			if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
			return `${n}th`;
		};
		return `Monthly on ${h.period.map(suffix).join(', ')}`;
	};
</script>

<div
	class="w-full min-h-[68px] rounded-lg border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 flex justify-between items-center px-5 py-2 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all duration-200"
>
	<div class="flex items-center gap-3">
		{#if habit.color}
			<div class="w-3 h-8 rounded-full" style="background-color: {habit.color}"></div>
		{/if}
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<span class="text-surface-900 dark:text-surface-50 font-medium">{habit.title}</span>
				<span class="text-[11px] px-2 py-0.5 rounded bg-surface-100-800 text-surface-700 dark:text-surface-200 w-fit">
					{habit.measurement === 'numeric' ? 'Progress' : 'Single step'}
				</span>
			</div>
			<span class="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary-50-900 text-primary-900-100 w-fit">
				<CalendarClock size={11} class="shrink-0" />
				<span class="truncate">{formatFrequency(habit)}</span>
			</span>
		</div>
	</div>
	{#if onedit}
		<button
			type="button"
			onclick={() => onedit(habit)}
			class="p-2 rounded-lg hover:bg-surface-200-700 transition-colors"
			aria-label="Edit habit"
		>
			<Edit2 size={16} />
		</button>
	{/if}
</div>
