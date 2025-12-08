<script lang="ts">
	import TopProgress from './components/TopProgress.svelte';
	import TaskSingle from './components/TaskSingle.svelte';
	import TaskProgressive from './components/TaskProgressive.svelte';
	import TaskProgressiveDetail from './components/TaskProgressiveDetail.svelte';
	import MenuDropdown from './components/MenuDropdown.svelte';
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { setCookie, setJsonCookie, deleteCookie } from '$lib/utils/cookie';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let data: {
		single: HabitWithStatus[];
		progressive: HabitWithStatus[];
		initialTab: 'single' | 'progressive';
		initialModal: { habitId: string; progress: number } | null;
	};

	// Initialize from server-provided values (no flash!)
	let activeTab: 'single' | 'progressive' = data.initialTab;
	let showDetail = false;
	let selectedProgressive: HabitWithStatus | null = null;
	let modalProgress: number | null = null;
	let error: string | null = null;

	// Restore modal state from server data
	if (data.initialModal) {
		const habit = data.progressive.find((p) => p.habit.id === data.initialModal!.habitId);
		if (habit) {
			selectedProgressive = structuredClone(habit);
			modalProgress = data.initialModal.progress;
			showDetail = true;
		} else if (browser) {
			// Clear invalid cookie (only on client)
			deleteCookie('overview-modal');
		}
	}

	// Local state for optimistic UI
	let single: HabitWithStatus[] = [];
	let progressive: HabitWithStatus[] = [];

	// Sync from server data when it changes
	$: single = data.single.map((s) => ({ ...s }));
	$: progressive = data.progressive.map((p) => ({ ...p }));

	function showError(message: string) {
		error = message;
		setTimeout(() => (error = null), 3000);
	}

	function openProgressive(p: HabitWithStatus) {
		selectedProgressive = structuredClone(p);
		modalProgress = null;
		showDetail = true;
		setJsonCookie('overview-modal', { habitId: p.habit.id, progress: p.progress });
	}

	function closeDetail() {
		showDetail = false;
		selectedProgressive = null;
		modalProgress = null;
		deleteCookie('overview-modal');
	}

	function onModalProgressChange(progress: number) {
		if (selectedProgressive) {
			setJsonCookie('overview-modal', { habitId: selectedProgressive.habit.id, progress });
		}
	}

	function toggleSingleOptimistic(habitId: string): HabitWithStatus[] {
		const previousState = single;
		single = single.map((s) =>
			s.habit.id === habitId ? { ...s, isCompleted: !s.isCompleted } : s
		);
		return previousState;
	}

	function revertSingle(previousState: HabitWithStatus[]) {
		single = previousState;
	}

	async function saveProgressive(updated: HabitWithStatus) {
		// Store previous state for rollback
		const previousState = progressive;

		// Optimistic update
		progressive = progressive.map((p) => (p.habit.id === updated.habit.id ? { ...updated } : p));
		closeDetail();

		// Sync with server
		try {
			const form = new FormData();
			form.append('id', updated.habit.id);
			form.append('progress', updated.progress.toString());
			const response = await fetch('?/updateProgressValue', { method: 'POST', body: form });

			if (!response.ok) {
				throw new Error('Failed to save progress');
			}
		} catch (e) {
			// Revert on failure
			progressive = previousState;
			showError('Failed to save progress. Please try again.');
		}
	}

	function onHabitTypeChange(val: 0 | 1) {
		activeTab = val === 1 ? 'single' : 'progressive';
		setCookie('overview-tab', activeTab);
	}
</script>

<!-- Error Toast -->
{#if error}
	<div
		class="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
	>
		{error}
	</div>
{/if}

<div class="p-4 sm:p-8">
	<!-- Top Progress -->
	<TopProgress {single} {progressive} />

	<!-- Toggle -->
	<div class="max-w-3xl mx-auto mt-4 mb-6 flex justify-center">
		<ToggleBar habitType={activeTab === 'single' ? 1 : 0} onChange={onHabitTypeChange} />
	</div>

	<!-- Content area -->
	<div class="max-w-3xl mx-auto">
		{#if activeTab === 'single'}
			<div class="space-y-3">
				{#if single.length === 0}
					<div class="text-surface-500 text-center py-6">
						No single-step tasks today. Create one in the Create page.
					</div>
				{:else}
					{#each single as s (s.habit.id)}
						<form
							method="POST"
							action="?/toggleSingle"
							use:enhance={() => {
								const previousState = toggleSingleOptimistic(s.habit.id);
								return async ({ result }) => {
									if (result.type === 'failure' || result.type === 'error') {
										revertSingle(previousState);
										showError('Failed to update task. Please try again.');
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

		{#if activeTab === 'progressive'}
			<div class="space-y-3">
				{#if progressive.length === 0}
					<div class="text-surface-500 text-center py-6">
						No progressive tasks today. Create one in the Create page.
					</div>
				{:else}
					{#each progressive as p (p.habit.id)}
						<TaskProgressive {p} onOpen={() => openProgressive(p)} />
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Progressive Detail Modal -->
	{#if showDetail && selectedProgressive}
		<TaskProgressiveDetail
			{selectedProgressive}
			initialProgress={modalProgress}
			onSave={saveProgressive}
			onClose={closeDetail}
			onProgressChange={onModalProgressChange}
		/>
	{/if}
</div>
