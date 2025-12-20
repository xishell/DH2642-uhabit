<script lang="ts">
	import HabitCard from '$lib/components/HabitCard.svelte';
	import GoalCard from '$lib/components/GoalCard.svelte';
	import type { HabitsState } from '$lib/presenters/habitsPresenter';
	import type { GoalWithHabitStatus, GoalWithProgress } from '$lib/types/goal';
	import type { Habit } from '$lib/types/habit';

	let {
		state,
		openHabitModal,
		openGoalModal
	}: {
		state: HabitsState;
		openHabitModal: (habit?: Habit | null) => void;
		openGoalModal: (goal?: GoalWithProgress | GoalWithHabitStatus | null) => void;
	} = $props();

	const hasHabits = $derived(state.habits.length > 0);
	const hasGoals = $derived(state.goals.length > 0);
</script>

{#if state.habitsLoading}
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-7">
		{#each Array(4) as _}
			<div class="h-24 rounded-xl bg-surface-200 dark:bg-surface-700 animate-pulse"></div>
		{/each}
	</div>
{:else if state.habitsError}
	<p class="text-center text-sm text-error-600">{state.habitsError}</p>
{:else if state.activeTab === 0}
	{#if !hasHabits}
		<p class="text-center text-surface-500 py-8">
			No habits yet.
			<button
				class="text-primary-600 hover:text-primary-500 underline underline-offset-2"
				onclick={() => openHabitModal()}
				type="button"
			>
				Create a habit
			</button>.
		</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-7">
			{#each state.habits as habit (habit.id)}
				<HabitCard {habit} onedit={openHabitModal} />
			{/each}
		</div>
	{/if}
{:else if !hasGoals}
	<p class="text-center text-surface-500 py-8">
		No goals yet. Create a goal to organize your habits!
	</p>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-7 items-start">
		{#each state.goals as goal (goal.id)}
			<GoalCard {goal} onedit={openGoalModal} />
		{/each}
	</div>
{/if}
