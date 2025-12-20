<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	let { s }: { s: HabitWithStatus } = $props();
</script>

<button
	type="submit"
	class="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition w-full text-left"
>
	<div class="flex items-center gap-4 flex-1 min-w-0">
		<div
			class="
                w-5 h-5 rounded-full flex items-center justify-center border-2
                transition
                border-surface-500
            "
			class:border-success-600={s.isCompleted}
			class:bg-success-600={s.isCompleted}
		>
			{#if s.isCompleted}
				<Check class="w-3 h-3 text-white" />
			{/if}
		</div>

		<div
			class="text-sm font-medium transition truncate"
			class:line-through={s.isCompleted}
			class:text-surface-400={s.isCompleted}
		>
			{s.habit.title}
		</div>
	</div>
</button>
