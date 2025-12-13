<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitModal from '$lib/components/HabitModal.svelte';
	import GoalModal from '$lib/components/GoalModal.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { untrack } from 'svelte';
	import { createHabitsPresenter } from '$lib/presenters/habitsPresenter';
	import type { Habit } from '$lib/types/habit';
	import type { GoalWithProgress, GoalWithHabitStatus } from '$lib/types/goal';
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
	const standaloneHabits = presenter.standaloneHabits;

	$effect(() => presenter.initData(data.habits, data.goals));

	$effect(() => {
		if (browser) {
			presenter.ensureQuote();
		}
	});

	// FAB menu state (local UI concern)
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

	// Delete handlers with confirmation (UI concern)
	async function handleDeleteHabit(habitId: string) {
		if (!confirm('Delete this habit? This cannot be undone.')) return;
		await presenter.deleteHabit(habitId);
	}

	async function handleDeleteGoal(goalId: string) {
		if (!confirm('Delete this goal? Habits will remain as standalone.')) return;
		await presenter.deleteGoal(goalId);
	}

	// Auto-open habit modal when directed via query param
	$effect(() => {
		if (!browser) return;
		const params = $page.url.searchParams;
		if (params.get('openHabitModal') === '1') {
			openHabitModal();
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
	onsave={presenter.saveHabit}
	ondelete={handleDeleteHabit}
/>

<GoalModal
	open={$presenterState.showGoalModal}
	goal={$presenterState.editingGoal}
	availableHabits={$standaloneHabits}
	onclose={presenter.closeGoalModal}
	onsave={presenter.saveGoal}
	oncreatehabit={presenter.createHabitForGoal}
	ondelete={handleDeleteGoal}
/>
