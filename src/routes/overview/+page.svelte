<script lang="ts">
	import TopProgress from './components/TopProgress.svelte';
	import TaskSingle from './components/TaskSingle.svelte';
	import TaskProgressive from './components/TaskProgressive.svelte';
	import TaskProgressiveDetail from './components/TaskProgressiveDetail.svelte';
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import type { HabitWithStatus } from '$lib/types/habit';
	import { createOverviewPresenter } from '$lib/presenters/overviewPresenter';

	let {
		data
	}: {
		data: {
			single: HabitWithStatus[];
			progressive: HabitWithStatus[];
			initialTab: 'single' | 'progressive';
			initialModal: { habitId: string; progress: number } | null;
		};
	} = $props();

	const presenter = createOverviewPresenter({
		initial: untrack(() => data),
		fetcher: fetch,
		browser
	});
	const state = presenter.state;

	// Keep SSR data in sync if server returns new values (e.g., after form submit)
	$effect(() => presenter.syncFromServer(data));
</script>

<!-- Error Toast -->
{#if $state.error}
	<div
		class="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
	>
		{$state.error}
	</div>
{/if}

<div class="p-4 sm:p-8">
	<!-- Top Progress -->
	<TopProgress single={$state.single} progressive={$state.progressive} />

	<!-- Toggle -->
	<div class="max-w-3xl mx-auto mt-4 mb-6 flex justify-center">
		<ToggleBar
			habitType={$state.activeTab === 'single' ? 1 : 0}
			onChange={presenter.setActiveTabFromToggle}
		/>
	</div>

	<!-- Content area -->
	<div class="max-w-3xl mx-auto">
		{#if $state.activeTab === 'single'}
			<div class="space-y-3">
				{#if $state.single.length === 0}
					<div class="text-surface-500 text-center py-6">
						No single-step tasks today. Create one in the Create page.
					</div>
				{:else}
					{#each $state.single as s (s.habit.id)}
						<form
							method="POST"
							action="?/toggleSingle"
							use:enhance={() => {
								const previousState = presenter.toggleSingleOptimistic(s.habit.id);
								return async ({ result }) => {
									if (result.type === 'failure' || result.type === 'error') {
										presenter.revertSingle(previousState);
										presenter.showError('Failed to update task. Please try again.');
									}
								};
							}}
						>
							<input type="hidden" name="id" value={s.habit.id} />
							<input type="hidden" name="done" value={!s.isCompleted} />
							<TaskSingle {s} />
						</form>
					{/each}
				{/if}
			</div>
		{/if}

		{#if $state.activeTab === 'progressive'}
			<div class="space-y-3">
				{#if $state.progressive.length === 0}
					<div class="text-surface-500 text-center py-6">
						No progressive tasks today. Create one in the Create page.
					</div>
				{:else}
					{#each $state.progressive as p (p.habit.id)}
						<TaskProgressive {p} onOpen={() => presenter.openProgressive(p)} />
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
