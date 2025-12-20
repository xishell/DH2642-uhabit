<script lang="ts">
	import TopProgressMultiRing from './components/TopProgressMultiRing.svelte';
	import TaskSingle from './components/TaskSingle.svelte';
	import TaskProgressive from './components/TaskProgressive.svelte';
	import TaskProgressiveDetail from './components/TaskProgressiveDetail.svelte';
	import GoalCard from '$lib/components/GoalCard.svelte';
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import type { HabitWithStatus } from '$lib/types/habit';
	import type { GoalWithHabitStatus } from '$lib/types/goal';
	import { createOverviewPresenter } from '$lib/presenters/overviewPresenter';

	let {
		data
	}: {
		data: {
			habits: HabitWithStatus[];
			goals: GoalWithHabitStatus[];
			initialTab: 'habits' | 'goals';
			initialModal: { habitId: string; progress: number } | null;
			totalHabits: number;
		};
	} = $props();

	const presenter = createOverviewPresenter({
		initial: untrack(() => ({
			habits: data.habits,
			goals: data.goals,
			initialTab: data.initialTab,
			initialModal: data.initialModal
		})),
		fetcher: fetch,
		browser
	});
	const state = presenter.state;

	// Keep SSR data in sync if server returns new values
	$effect(() => presenter.syncFromServer(data));

	// Derived: split habits by measurement type for display
	const booleanHabits = $derived($state.habits.filter((h) => h.habit.measurement === 'boolean'));
	const numericHabits = $derived($state.habits.filter((h) => h.habit.measurement === 'numeric'));
	const hasAnyHabits = $derived(data.totalHabits > 0);
</script>

<!-- Error Toast -->
{#if $state.error}
	<div
		class="fixed top-4 left-1/2 -translate-x-1/2 bg-error-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
	>
		{$state.error}
	</div>
{/if}

<div class="p-4 sm:p-8">
	<!-- Top Progress -->
	<TopProgressMultiRing
		single={booleanHabits}
		progressive={numericHabits}
		showInnerRings={$state.activeTab === 'habits'}
	/>

	<!-- Toggle -->
	<div class="max-w-3xl mx-auto mt-4 mb-6 flex justify-center">
		<ToggleBar
			activeTab={$state.activeTab === 'habits' ? 0 : 1}
			onChange={presenter.setActiveTab}
		/>
	</div>

	<!-- Content area -->
	<div class="max-w-3xl mx-auto">
		{#if $state.activeTab === 'habits'}
			<!-- Habits Tab: All habits due today -->
			<div class="space-y-3">
				{#if $state.habits.length === 0}
					{#if hasAnyHabits}
						<div class="text-surface-500 text-center py-6">
							No habits due today. Enjoy your day!
						</div>
					{:else}
						<div class="text-surface-500 text-center py-6">
							No habits yet.
							<button
								type="button"
								class="text-primary-600 hover:text-primary-500 underline underline-offset-2"
								onclick={() => goto('/habits?openHabitModal=1')}
							>
								Start a habit
							</button>
							.
						</div>
					{/if}
				{:else}
					<!-- Boolean habits (checkboxes) -->
					{#each booleanHabits as s (s.habit.id)}
						<form
							method="POST"
							action="?/toggleSingle"
							use:enhance={() => {
								const previousState = presenter.toggleSingleOptimistic(s.habit.id);
								return async ({ result }) => {
									if (result.type === 'failure' || result.type === 'error') {
										presenter.revertHabits(previousState);
										presenter.showError('Failed to update habit. Please try again.');
									}
								};
							}}
						>
							<input type="hidden" name="id" value={s.habit.id} />
							<input type="hidden" name="done" value={!s.isCompleted} />
							<TaskSingle {s} />
						</form>
					{/each}

					<!-- Numeric habits (progress) -->
					{#each numericHabits as p (p.habit.id)}
						<TaskProgressive
							{p}
							onOpen={() => presenter.openProgressive(p)}
							onToggleComplete={() => presenter.toggleProgressiveComplete(p)}
						/>
					{/each}
				{/if}
			</div>
		{:else}
			<!-- Goals Tab -->
			<div class="space-y-4">
				{#if $state.goals.length === 0}
					<div class="text-surface-500 text-center py-6">
						No active goals. Create a goal to organize your habits!
					</div>
				{:else}
					{#each $state.goals as goal (goal.id)}
						<GoalCard {goal} />
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Progressive Detail Modal -->
	{#if $state.showDetail && $state.selectedProgressive}
		<TaskProgressiveDetail
			selectedProgressive={$state.selectedProgressive}
			initialProgress={$state.modalProgress}
			onSave={presenter.saveProgressive}
			onClose={presenter.closeDetail}
			onProgressChange={presenter.onModalProgressChange}
		/>
	{/if}
</div>
