<script lang="ts">
	import { Plus, Check } from 'lucide-svelte';
	import type { Habit } from '$lib/types/habit';

	let {
		selectableHabits = [],
		selectedHabitIds = new Set<string>(),
		onToggle,
		onCreateHabit
	}: {
		selectableHabits?: Habit[];
		selectedHabitIds?: Set<string>;
		onToggle?: (habitId: string) => void;
		onCreateHabit?: () => void;
	} = $props();

	const hasHabits = $derived(selectableHabits.length > 0);
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between">
		<span class="text-sm font-medium">Attach Habits</span>
		{#if onCreateHabit}
			<button
				type="button"
				class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
				onclick={onCreateHabit}
			>
				<Plus size={16} />
				New Habit
			</button>
		{/if}
	</div>

	{#if !hasHabits}
		<p class="text-sm text-surface-500 py-4 text-center">
			No habits available. Create a habit first.
		</p>
	{:else}
		<div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
			{#each selectableHabits as habit (habit.id)}
				<button
					type="button"
					class="flex items-center gap-3 p-3 rounded-lg border transition-colors text-left"
					class:border-primary-500={selectedHabitIds.has(habit.id)}
					class:bg-primary-100-900={selectedHabitIds.has(habit.id)}
					class:border-surface-300-700={!selectedHabitIds.has(habit.id)}
					onclick={() => onToggle?.(habit.id)}
				>
					<div
						class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
						class:border-primary-500={selectedHabitIds.has(habit.id)}
						class:bg-primary-500={selectedHabitIds.has(habit.id)}
						class:border-surface-400-600={!selectedHabitIds.has(habit.id)}
					>
						{#if selectedHabitIds.has(habit.id)}
							<Check size={14} class="text-white" />
						{/if}
					</div>
					<div class="flex-1">
						<span class="font-medium">{habit.title}</span>
						<span class="text-xs text-surface-500 ml-2 capitalize">{habit.frequency}</span>
					</div>
					{#if habit.color}
						<div class="w-3 h-3 rounded-full" style="background-color: {habit.color}"></div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
