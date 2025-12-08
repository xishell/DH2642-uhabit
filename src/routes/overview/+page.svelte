<script lang="ts">
	import { onMount } from 'svelte';
	import { Tabs, Tab } from '@skeletonlabs/svelte';
	import { Button } from '@skeletonlabs/svelte';
	import TopProgress from '$lib/components/TopProgress.svelte';
	import TaskSingle from '$lib/components/TaskSingle.svelte';
	import TaskProgressive from '$lib/components/TaskProgressive.svelte';
	import TaskProgressiveDetail from '$lib/components/TaskProgressiveDetail.svelte';
	import MenuDropdown from '$lib/components/MenuDropdown.svelte';
	import { enhance } from '$app/forms';

	export let data;

	let activeTab = 'single';
	let showDetail = false;
	let selectedProgressive: any = null;

	const { single, progressive } = data;

	function openProgressive(p: any) {
		selectedProgressive = structuredClone(p);
		showDetail = true;
	}

	function closeDetail() {
		showDetail = false;
		selectedProgressive = null;
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
	<Tabs class="mt-4 mb-6">
		<Tab
			checked={activeTab === 'single'}
			on:click={() => (activeTab = 'single')}
			class="flex-1 py-2 rounded-full border text-sm font-medium"
			class:!bg-violet-600={activeTab === 'single'}
			class:!text-white={activeTab === 'single'}
		>
			Single-Step
		</Tab>

		<Tab
			checked={activeTab === 'progressive'}
			on:click={() => (activeTab = 'progressive')}
			class="flex-1 py-2 rounded-full border text-sm font-medium"
			class:!bg-violet-600={activeTab === 'progressive'}
			class:!text-white={activeTab === 'progressive'}
		>
			Progressive
		</Tab>
	</Tabs>

	<!-- Single-Step Tasks -->
	{#if activeTab === 'single'}
		<div class="space-y-3">
			{#if single.length === 0}
				<div class="text-surface-500 text-center py-6">
					No single-step tasks today. Create one in the Create page.
				</div>
			{:else}
				{#each single as s (s.id)}
					<form method="POST" use:enhance action="?/toggleSingle">
						<input type="hidden" name="id" value={s.id} />
						<input type="hidden" name="done" value={!s.done} />
						<TaskSingle {s} on:toggle={() => null} />
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
				{#each progressive as p (p.id)}
					<TaskProgressive
						{p}
						on:open={() => openProgressive(p)}
						on:change={(e) => {
							const delta = e.detail;
							const newValue = Math.max(0, Math.min(p.targetAmount, p.progress + delta));
							const form = new FormData();
							form.append('id', p.id);
							form.append('progress', newValue.toString());
							fetch('?/updateProgressValue', { method: 'POST', body: form });
						}}
					/>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Progressive Detail Modal/Drawer -->
	{#if showDetail && selectedProgressive}
		<TaskProgressiveDetail
			{selectedProgressive}
			on:save={(e) => {
				const updated = e.detail;
				const form = new FormData();
				form.append('id', updated.id);
				form.append('progress', updated.progress);
				form.append('targetAmount', updated.targetAmount);
				fetch('?/updateProgressive', { method: 'POST', body: form });
				closeDetail();
			}}
			on:close={closeDetail}
		/>
	{/if}
</div>
