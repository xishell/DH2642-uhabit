<script lang="ts">
	import Modal from './Modal.svelte';
	import HabitModal from './HabitModal.svelte';
	import { Plus, Check } from 'lucide-svelte';
	import type {
		Goal,
		GoalWithHabits,
		GoalWithHabitStatus,
		GoalWithProgress
	} from '$lib/types/goal';
	import type { Habit, HabitWithStatus } from '$lib/types/habit';

	let {
		open = false,
		goal = null,
		availableHabits = [],
		onclose,
		onsave,
		oncreatehabit,
		ondelete
	}: {
		open: boolean;
		goal?: Goal | GoalWithHabits | GoalWithProgress | GoalWithHabitStatus | null;
		availableHabits?: Habit[];
		onclose: () => void;
		onsave: (goal: Partial<Goal>, habitIds: string[]) => void;
		oncreatehabit?: (habit: Partial<Habit>) => Promise<Habit>;
		ondelete?: (goalId: string) => void;
	} = $props();

	const isEditMode = $derived(!!goal);
	const modalTitle = $derived(isEditMode ? 'Edit Goal' : 'New Goal');

	// Get habits attached to the goal (if editing)
	const goalHabits = $derived((): Habit[] => {
		if (!goal || !('habits' in goal) || !goal.habits) return [];
		const habits = goal.habits as (Habit | HabitWithStatus)[];
		return habits.map((h) => ('habit' in h ? h.habit : h));
	});

	// Form state
	let title = $state('');
	let description = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let selectedHabitIds = $state<Set<string>>(new Set());

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Nested habit modal state
	let showHabitModal = $state(false);

	// Format date for input
	function formatDateForInput(date: Date | string): string {
		const d = new Date(date);
		return d.toISOString().split('T')[0];
	}

	// Reset form when modal opens or goal changes
	$effect(() => {
		if (open) {
			if (goal) {
				title = goal.title;
				description = goal.description ?? '';
				startDate = formatDateForInput(goal.startDate);
				endDate = formatDateForInput(goal.endDate);
				// Pre-select habits attached to the goal
				selectedHabitIds = new Set(goalHabits().map((h) => h.id));
			} else {
				title = '';
				description = '';
				// Default to today and one month from now
				const today = new Date();
				const oneMonthLater = new Date();
				oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
				startDate = formatDateForInput(today);
				endDate = formatDateForInput(oneMonthLater);
				selectedHabitIds = new Set();
			}
			error = null;
		}
	});

	function toggleHabit(habitId: string) {
		if (selectedHabitIds.has(habitId)) {
			selectedHabitIds.delete(habitId);
		} else {
			selectedHabitIds.add(habitId);
		}
		selectedHabitIds = new Set(selectedHabitIds);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!title.trim()) {
			error = 'Title is required';
			return;
		}

		if (!startDate || !endDate) {
			error = 'Start and end dates are required';
			return;
		}

		if (new Date(endDate) <= new Date(startDate)) {
			error = 'End date must be after start date';
			return;
		}

		isSubmitting = true;
		error = null;

		const goalData: Partial<Goal> = {
			title: title.trim(),
			description: description.trim() || null,
			startDate: new Date(startDate + 'T00:00:00Z'),
			endDate: new Date(endDate + 'T23:59:59Z')
		};

		if (goal?.id) {
			goalData.id = goal.id;
		}

		try {
			await onsave(goalData, Array.from(selectedHabitIds));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save goal';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCreateHabit(habitData: Partial<Habit>) {
		if (!oncreatehabit) return;

		try {
			const newHabit = await oncreatehabit(habitData);
			// Auto-select the newly created habit
			selectedHabitIds.add(newHabit.id);
			selectedHabitIds = new Set(selectedHabitIds);
			showHabitModal = false;
		} catch (err) {
			throw err;
		}
	}

	// Available habits = standalone + ones already on this goal
	const selectableHabits = $derived(() => {
		const standalone = availableHabits.filter((h) => !h.goalId);
		// When editing, include habits attached to this goal
		const attached = goalHabits().filter((gh) => !standalone.some((sh) => sh.id === gh.id));
		return [...standalone, ...attached];
	});
</script>

<Modal {open} title={modalTitle} {onclose}>
	<form onsubmit={handleSubmit} class="flex flex-col gap-6">
		{#if error}
			<p class="text-red-600 text-sm text-center">{error}</p>
		{/if}

		<!-- Goal Details -->
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="goal-title" class="text-sm font-medium"
					>Title <span class="text-red-500">*</span></label
				>
				<input
					id="goal-title"
					type="text"
					class="border border-surface-300-600 rounded-md px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
					placeholder="e.g. Get healthier this month"
					bind:value={title}
					required
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="goal-description" class="text-sm font-medium">Description</label>
				<textarea
					id="goal-description"
					class="w-full rounded-md border border-surface-300-600 px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
					rows="2"
					placeholder="Describe your goal..."
					bind:value={description}
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col gap-1">
					<label for="goal-start" class="text-sm font-medium"
						>Start Date <span class="text-red-500">*</span></label
					>
					<input
						id="goal-start"
						type="date"
						class="border border-surface-300-600 rounded-md px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
						bind:value={startDate}
						required
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label for="goal-end" class="text-sm font-medium"
						>End Date <span class="text-red-500">*</span></label
					>
					<input
						id="goal-end"
						type="date"
						class="border border-surface-300-600 rounded-md px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
						bind:value={endDate}
						min={startDate}
						required
					/>
				</div>
			</div>
		</div>

		<!-- Attach Habits Section -->
		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">Attach Habits</span>
				{#if oncreatehabit}
					<button
						type="button"
						class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
						onclick={() => (showHabitModal = true)}
					>
						<Plus size={16} />
						New Habit
					</button>
				{/if}
			</div>

			{#if selectableHabits().length === 0}
				<p class="text-sm text-surface-500 py-4 text-center">
					No habits available. Create a habit first.
				</p>
			{:else}
				<div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
					{#each selectableHabits() as habit}
						<button
							type="button"
							class="flex items-center gap-3 p-3 rounded-lg border transition-colors text-left"
							class:border-primary-500={selectedHabitIds.has(habit.id)}
							class:bg-primary-50={selectedHabitIds.has(habit.id)}
							class:dark:bg-primary-900={selectedHabitIds.has(habit.id)}
							class:border-surface-200-700={!selectedHabitIds.has(habit.id)}
							onclick={() => toggleHabit(habit.id)}
						>
							<div
								class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
								class:border-primary-500={selectedHabitIds.has(habit.id)}
								class:bg-primary-500={selectedHabitIds.has(habit.id)}
								class:border-surface-300-600={!selectedHabitIds.has(habit.id)}
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

		<!-- Actions -->
		<div class="flex justify-end gap-3 pt-4 border-t border-surface-200-700">
			{#if isEditMode && goal?.id && ondelete}
				<button
					type="button"
					class="px-4 py-2 text-sm rounded-md border border-error-500 text-error-600 hover:bg-error-50 transition-colors"
					onclick={() => ondelete(goal.id!)}
					disabled={isSubmitting}
				>
					Delete
				</button>
			{/if}
			<button
				type="button"
				class="px-4 py-2 text-sm rounded-md border border-surface-300-600 hover:bg-surface-200-700 transition-colors"
				onclick={onclose}
				disabled={isSubmitting}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="px-4 py-2 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Goal'}
			</button>
		</div>
	</form>
</Modal>

<!-- Nested Habit Modal -->
{#if oncreatehabit}
	<HabitModal
		open={showHabitModal}
		onclose={() => (showHabitModal = false)}
		onsave={handleCreateHabit}
	/>
{/if}
