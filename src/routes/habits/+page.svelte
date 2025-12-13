<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitModal from '$lib/components/HabitModal.svelte';
	import GoalModal from '$lib/components/GoalModal.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { untrack } from 'svelte';
	import { createHabitsPresenter } from '$lib/presenters/habitsPresenter';
	import type { Habit } from '$lib/types/habit';
	import type { GoalWithProgress, Goal, GoalWithHabitStatus } from '$lib/types/goal';
	import MotivationCard from './components/MotivationCard.svelte';
	import HabitsListView from './components/HabitsListView.svelte';
	import FabMenu from './components/FabMenu.svelte';

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

	// FAB menu state (local)
	let showFabMenu = $state(false);

	function toggleFabMenu() {
		showFabMenu = !showFabMenu;
	}

	function openHabitModal(habitToEdit?: Habit | null) {
		showFabMenu = false;
		presenter.openHabitModal(habitToEdit ?? null);
	}

	function openGoalModal(goalToEdit: GoalWithProgress | GoalWithHabitStatus | null = null) {
		showFabMenu = false;
		presenter.openGoalModal(goalToEdit ? (goalToEdit as GoalWithProgress) : null);
	}

	async function handleSaveHabit(habitData: Partial<Habit>) {
		const isEdit = Boolean(habitData.id);
		const endpoint = isEdit ? `/api/habits/${habitData.id}` : '/api/habits';
		const method = isEdit ? 'PATCH' : 'POST';

		const res = await fetch(endpoint, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(habitData)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || `Failed to ${isEdit ? 'update' : 'create'} habit`);
		}

		presenter.closeHabitModal();
		presenter.setActiveTab(0);
		await presenter.refreshData();
	}

	async function handleSaveGoal(goalData: Partial<Goal>, habitIds: string[]) {
		const isEdit = Boolean(goalData.id);
		const endpoint = isEdit ? `/api/goals/${goalData.id}` : '/api/goals';
		const method = isEdit ? 'PATCH' : 'POST';

		const payload = {
			title: goalData.title,
			description: goalData.description ?? null,
			startDate:
				goalData.startDate instanceof Date
					? goalData.startDate.toISOString().split('T')[0]
					: goalData.startDate,
			endDate:
				goalData.endDate instanceof Date
					? goalData.endDate.toISOString().split('T')[0]
					: goalData.endDate,
			habitIds
		};

		const res = await fetch(endpoint, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || `Failed to ${isEdit ? 'update' : 'create'} goal`);
		}

		presenter.closeGoalModal();
		presenter.setActiveTab(1);
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

	// Auto-open habit modal when directed via query param
	$effect(() => {
		if (!browser) return;
		const params = $page.url.searchParams;
		if (params.get('openHabitModal') === '1') {
			openHabitModal();
			// Remove param to avoid reopening on refresh
			const url = new URL(window.location.href);
			url.searchParams.delete('openHabitModal');
			window.history.replaceState({}, '', url);
		}
	});
</script>

<div class="planning-view flex flex-col items-center p-7 max-w-[800px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start">Plan UHabit</h3>

	<MotivationCard
		quote={$presenterState.quote}
		author={$presenterState.author}
		loading={$presenterState.isQuoteLoading}
	/>

	<!-- ToggleBar -->
	<ToggleBar activeTab={$presenterState.activeTab} onChange={presenter.setActiveTab} />

	<!-- Content -->
	<div class="w-full mt-6">
		<HabitsListView state={$presenterState} {openHabitModal} {openGoalModal} />
	</div>
	<FabMenu
		open={showFabMenu}
		onToggle={toggleFabMenu}
		onCreateHabit={() => openHabitModal()}
		onCreateGoal={() => openGoalModal()}
	/>
</div>

<!-- Modals -->
<HabitModal
	open={$presenterState.showHabitModal}
	habit={$presenterState.editingHabit}
	onclose={presenter.closeHabitModal}
	onsave={handleSaveHabit}
	ondelete={async (habitId) => {
		if (!confirm('Delete this habit? This cannot be undone.')) return;
		const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to delete habit');
		}
		presenter.closeHabitModal();
		await presenter.refreshData();
		// Ensure UI reflects removal immediately without stale selection
		$presenterState.habits = $presenterState.habits.filter((h) => h.id !== habitId);
	}}
/>

<GoalModal
	open={$presenterState.showGoalModal}
	goal={$presenterState.editingGoal}
	availableHabits={standaloneHabits}
	onclose={presenter.closeGoalModal}
	onsave={handleSaveGoal}
	oncreatehabit={handleCreateHabitForGoal}
	ondelete={async (goalId) => {
		if (!confirm('Delete this goal? Habits will remain as standalone.')) return;
		const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
		if (!res.ok) {
			const error = await res.text();
			throw new Error(error || 'Failed to delete goal');
		}
		presenter.closeGoalModal();
		await presenter.refreshData();
		// Drop deleted goal immediately to avoid stale view
		$presenterState.goals = $presenterState.goals.filter((g) => g.id !== goalId);
	}}
/>
