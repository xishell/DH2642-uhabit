<script lang="ts">
	import TopProgress from './components/TopProgress.svelte';
	import TaskSingle from './components/TaskSingle.svelte';
	import TaskProgressive from './components/TaskProgressive.svelte';
	import TaskProgressiveDetail from './components/TaskProgressiveDetail.svelte';
	import MenuDropdown from './components/MenuDropdown.svelte';
	import { enhance } from '$app/forms';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let data: {
		single: HabitWithStatus[];
		progressive: HabitWithStatus[];
	};

	let activeTab = 'single';
	let showDetail = false;
	let selectedProgressive: HabitWithStatus | null = null;

	const { single, progressive } = data;

	function openProgressive(p: HabitWithStatus) {
		selectedProgressive = structuredClone(p);
		showDetail = true;
	}

	function closeDetail() {
		showDetail = false;
		selectedProgressive = null;
	}

	function saveProgressive(updated: HabitWithStatus) {
		const form = new FormData();
		form.append('id', updated.habit.id);
		form.append('progress', updated.progress.toString());
		form.append('targetAmount', (updated.habit.targetAmount ?? 0).toString());
		fetch('?/updateProgressive', { method: 'POST', body: form });
		closeDetail();
	}
</script>

<div class="min-h-screen p-4 sm:p-8 bg-surface-50">
	<!-- Header -->
	<header class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-semibold">Today's Habits</h1>
		<MenuDropdown />
	</header>

	<!-- Top Progress -->
	<TopProgress {single} {progressive} />

	<!-- Tabs -->
	<div class="mt-4 mb-6 flex gap-2">
		<button
			on:click={() => (activeTab = 'single')}
			class={`flex-1 py-2 rounded-full border text-sm font-medium ${activeTab === 'single' ? 'bg-violet-600 text-white' : 'bg-white text-surface-700'}`}
		>
			Single-Step
		</button>

		<button
			on:click={() => (activeTab = 'progressive')}
			class={`flex-1 py-2 rounded-full border text-sm font-medium ${activeTab === 'progressive' ? 'bg-violet-600 text-white' : 'bg-white text-surface-700'}`}
		>
			Progressive
		</button>
	</div>

	<!-- Single-Step Tasks -->
	{#if activeTab === 'single'}
		<div class="space-y-3">
			{#if single.length === 0}
				<div class="text-surface-500 text-center py-6">
					No single-step tasks today. Create one in the Create page.
				</div>
			{:else}
				{#each single as s (s.habit.id)}
					<form method="POST" use:enhance action="?/toggleSingle">
						<input type="hidden" name="id" value={s.habit.id} />
						<input type="hidden" name="done" value={!s.isCompleted} />
						<TaskSingle {s} />
					</form>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Progressive Tasks -->
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

	<!-- Progressive Detail Modal/Drawer -->
	{#if showDetail && selectedProgressive}
		<TaskProgressiveDetail {selectedProgressive} onSave={saveProgressive} onClose={closeDetail} />
	{/if}
</div>
