<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import GoalCard from '$lib/components/GoalCard.svelte';
	import HabitModal from '$lib/components/HabitModal.svelte';
	import GoalModal from '$lib/components/GoalModal.svelte';
	import { Plus } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { createHabitsPresenter } from '$lib/presenters/habitsPresenter';
	import type { Habit } from '$lib/types/habit';
	import type { GoalWithProgress, Goal } from '$lib/types/goal';

	let { data }: { data: any } = $props();

	const initialData = untrack(() => ({
		habits: data.habits,
		goals: data.goals,
		quote: data.quote,
		author: data.author,
		initialTab: data.initialTab
	}));

	const presenter = createHabitsPresenter({
		initial: initialData,
		fetcher: fetch,
		browser,
		storage: browser ? sessionStorage : null
	});

	const presenterState = presenter.state;

	$effect(() => presenter.initData(data.habits, data.goals));

	$effect(() => {
		if (browser) {
			presenter.ensureQuote();
		}
	});

	// FAB menu state
	let showFabMenu = $state(false);
	let showHabitModal = $state(false);
	let showGoalModal = $state(false);

	function toggleFabMenu() {
		showFabMenu = !showFabMenu;
	}

	function openHabitModal() {
		showFabMenu = false;
		showHabitModal = true;
	}

	function openGoalModal() {
		showFabMenu = false;
		showGoalModal = true;
	}

	async function handleCreateHabit(habitData: Partial<Habit>) {
		const res = await fetch('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habitData)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to create habit');
		}

		showHabitModal = false;
		await presenter.refreshData();
	}

	async function handleCreateGoal(goalData: Partial<Goal>, habitIds: string[]) {
		const res = await fetch('/api/goals', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...goalData,
				startDate:
					goalData.startDate instanceof Date
						? goalData.startDate.toISOString().split('T')[0]
						: goalData.startDate,
				endDate:
					goalData.endDate instanceof Date
						? goalData.endDate.toISOString().split('T')[0]
						: goalData.endDate,
				habitIds
			})
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to create goal');
		}

		showGoalModal = false;
		await presenter.refreshData();
	}

	// Create habit from within goal modal
	async function handleCreateHabitForGoal(habitData: Partial<Habit>): Promise<Habit> {
		const res = await fetch('/api/habits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habitData)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to create habit');
		}

		const newHabit = (await res.json()) as Habit;
		await presenter.refreshData();
		return newHabit;
	}

	// Standalone habits (not attached to any goal)
	const standaloneHabits = $derived($presenterState.habits.filter((h) => !h.goalId));
</script>

<div class="planning-view flex flex-col items-center p-7 max-w-[800px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start">Plan UHabit</h3>

	<!-- motivation-card -->
	<div
		class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-primary-300-700 text-white opacity-80 rounded-[10px]"
	>
		{#if $presenterState.isQuoteLoading}
			<div class="w-full max-w-[560px] space-y-3 animate-pulse">
				<div class="h-5 w-4/5 mx-auto rounded-full bg-white/25"></div>
				<div class="h-5 w-11/12 mx-auto rounded-full bg-white/15"></div>
				<div class="h-4 w-1/3 mx-auto rounded-full bg-white/20"></div>
			</div>
		{:else}
			<p class="leading-snug">
				"{$presenterState.quote}"
				{#if $presenterState.author}
					<br />
					<span class="text-sm opacity-80">— {$presenterState.author}</span>
				{/if}
			</p>
		{/if}
	</div>

	<!-- ToggleBar -->
	<ToggleBar activeTab={$presenterState.activeTab} onChange={presenter.setActiveTab} />

	<!-- Content -->
	<div class="w-full mt-6">
		{#if $presenterState.habitsLoading}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-7">
				{#each Array(4) as _}
					<div class="h-24 rounded-xl bg-surface-200 dark:bg-surface-700 animate-pulse"></div>
				{/each}
			</div>
		{:else if $presenterState.habitsError}
			<p class="text-center text-sm text-red-600">{$presenterState.habitsError}</p>
		{:else if $presenterState.activeTab === 0}
			<!-- Tasks Tab: All habits -->
			{#if $presenterState.habits.length === 0}
				<p class="text-center text-surface-500 py-8">
					No habits yet. Create your first habit to get started!
				</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-7">
					{#each $presenterState.habits as habit (habit.id)}
						<HabitCard title={habit.title} habitId={habit.id} />
					{/each}
				</div>
			{/if}
		{:else}
			<!-- Goals Tab -->
			{#if $presenterState.goals.length === 0}
				<p class="text-center text-surface-500 py-8">
					No goals yet. Create a goal to organize your habits!
				</p>
			{:else}
				<div class="flex flex-col gap-4">
					{#each $presenterState.goals as goal (goal.id)}
						<GoalCard {goal} />
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	<!-- Blur overlay for FAB menu -->
	{#if showFabMenu}
		<div
			class="fixed inset-0 bg-black/30 z-40"
			transition:fade={{ duration: 200 }}
			onclick={toggleFabMenu}
			onkeydown={(e) => e.key === 'Enter' && toggleFabMenu()}
			role="button"
			tabindex="-1"
		></div>
	{/if}

	<!-- FAB Menu -->
	<div class="fixed bottom-10 right-10 flex flex-col items-end gap-3 z-50">
		{#if showFabMenu}
			<div class="flex flex-col gap-2" transition:fade={{ duration: 150 }}>
				<button
					class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-400 transition-colors text-sm"
					onclick={openHabitModal}
				>
					Create Task
				</button>
				<button
					class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-400 transition-colors text-sm"
					onclick={openGoalModal}
				>
					Create Goal
				</button>
			</div>
		{/if}

		<button
			class="w-16 h-16 bg-primary-500 rounded-full shadow-xl hover:bg-primary-400 transition-all duration-200 flex items-center justify-center text-white"
			onclick={toggleFabMenu}
		>
			<Plus
				size={26}
				strokeWidth={3}
				class="transition-transform duration-200 {showFabMenu ? 'rotate-45' : ''}"
			/>
		</button>
	</div>
</div>

<!-- Modals -->
<HabitModal
	open={showHabitModal}
	onclose={() => (showHabitModal = false)}
	onsave={handleCreateHabit}
/>

<GoalModal
	open={showGoalModal}
	availableHabits={standaloneHabits}
	onclose={() => (showGoalModal = false)}
	onsave={handleCreateGoal}
	oncreatehabit={handleCreateHabitForGoal}
/>
