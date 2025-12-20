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

	const limitList = (items: string[], limit = 3) => {
		const full = items.join(', ');
		if (items.length <= limit) return { full, compact: full };
		return {
			full,
			compact: `${items.slice(0, limit).join(', ')} +${items.length - limit} more`
		};
	};

	const formatFrequency = (h: Habit): { full: string; compact: string } => {
		if (h.frequency === 'daily') return { full: 'Daily', compact: 'Daily' };
		if (h.frequency === 'weekly') {
			if (!h.period?.length) return { full: 'Weekly', compact: 'Weekly' };
			const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			const days = h.period.map((d) => labels[d] || `${d}`);
			const { full, compact } = limitList(days, 4);
			return { full: `Weekly on ${full}`, compact: `Weekly on ${compact}` };
		}
		// monthly
		if (!h.period?.length) return { full: 'Monthly', compact: 'Monthly' };
		const suffix = (n: number) => {
			if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
			if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
			if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
			return `${n}th`;
		};
		const dates = h.period.map(suffix);
		const { full, compact } = limitList(dates, 3);
		return { full: `Monthly on ${full}`, compact: `Monthly on ${compact}` };
	};

	const frequency = $derived(formatFrequency(habit));
</script>

<div
	class="w-full min-h-[68px] rounded-xl border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 flex justify-between items-center px-5 py-2 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all duration-200"
>
	<div class="flex items-center gap-3 min-w-0">
		{#if habit.color}
			<div class="w-3 h-8 rounded-full shrink-0" style="background-color: {habit.color}"></div>
		{/if}
		<div class="flex flex-col gap-1 min-w-0">
			<div class="flex items-center gap-2 min-w-0">
				<span
					class="text-surface-900 dark:text-surface-50 font-medium truncate"
					title={habit.title}
				>
					{habit.title}
				</span>
				<span
					class="text-[11px] px-2 py-0.5 rounded bg-surface-100-800 text-surface-700 dark:text-surface-200 w-fit whitespace-nowrap shrink-0"
				>
					{habit.measurement === 'numeric' ? 'Progress' : 'Single step'}
				</span>
			</div>
			<span
				class="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary-50-900 text-primary-900-100 max-w-full min-w-0"
				title={frequency.full}
			>
				<CalendarClock size={11} class="shrink-0" />
				<span class="truncate">{frequency.compact}</span>
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
