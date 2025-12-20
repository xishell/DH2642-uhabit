<script lang="ts">
	import Modal from './Modal.svelte';
	import HabitModal from './HabitModal.svelte';
	import GoalHabitsSelector from './GoalHabitsSelector.svelte';
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

	// Color options (same as habits for consistency)
	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];

	// Form state
	let title = $state('');
	let description = $state('');
	let selectedColor = $state(colors[2]);
	let startDate = $state('');
	let endDate = $state('');
	let selectedHabitIds = $state<Set<string>>(new Set());

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Nested habit modal state
	let showHabitModal = $state(false);

	const openHabitCreation = () => {
		showHabitModal = true;
	};

	// Format date for input (handles Date, string, or timestamp number)
	function formatDateForInput(date: Date | string | number | null | undefined): string {
		if (!date) return '';
		// Handle timestamp stored as string
		let parsed = date;
		if (typeof date === 'string' && /^\d+$/.test(date)) {
			parsed = parseInt(date, 10);
		}
		const d = new Date(parsed);
		if (isNaN(d.getTime())) return '';
		return d.toISOString().split('T')[0];
	}

	// Reset form when modal opens or goal changes
	$effect(() => {
		if (open) {
			if (goal) {
				title = goal.title;
				description = goal.description ?? '';
				selectedColor = goal.color ?? colors[2];
				startDate = formatDateForInput(goal.startDate);
				endDate = formatDateForInput(goal.endDate);
				// Pre-select habits attached to the goal
				selectedHabitIds = new Set(goalHabits().map((h) => h.id));
			} else {
				title = '';
				description = '';
				selectedColor = colors[2];
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
			color: selectedColor,
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
			<p class="text-error-600 text-sm text-center">{error}</p>
		{/if}

		<!-- Goal Details -->
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="goal-title" class="text-sm font-medium"
					>Title <span class="text-error-500">*</span></label
				>
				<input
					id="goal-title"
					type="text"
					class="border border-surface-400-600 rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
					placeholder="e.g. Get healthier this month"
					bind:value={title}
					required
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="goal-description" class="text-sm font-medium">Description</label>
				<textarea
					id="goal-description"
					class="w-full rounded-md border border-surface-400-600 px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
					rows="2"
					placeholder="Describe your goal..."
					bind:value={description}
				></textarea>
			</div>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">Color</span>
				<div class="flex gap-2 flex-wrap">
					{#each colors as color}
						<button
							type="button"
							class="relative w-9 h-9 rounded-full border-2 transition-all duration-150"
							style="background-color: {color};"
							class:border-primary-500={selectedColor === color}
							class:ring-2={selectedColor === color}
							class:ring-primary-200={selectedColor === color}
							class:border-transparent={selectedColor !== color}
							onclick={() => (selectedColor = color)}
							aria-label={`Select color ${color}`}
							aria-pressed={selectedColor === color}
						>
							{#if selectedColor === color}
								<span
									class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white/80 dark:bg-black/70"
								></span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col gap-1">
					<label for="goal-start" class="text-sm font-medium"
						>Start Date <span class="text-error-500">*</span></label
					>
					<input
						id="goal-start"
						type="date"
						class="border border-surface-400-600 rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						bind:value={startDate}
						required
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label for="goal-end" class="text-sm font-medium"
						>End Date <span class="text-error-500">*</span></label
					>
					<input
						id="goal-end"
						type="date"
						class="border border-surface-400-600 rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						bind:value={endDate}
						min={startDate}
						required
					/>
				</div>
			</div>
		</div>

		<GoalHabitsSelector
			selectableHabits={selectableHabits()}
			{selectedHabitIds}
			onToggle={toggleHabit}
			onCreateHabit={oncreatehabit ? openHabitCreation : undefined}
		/>

		<!-- Actions -->
		<div class="flex justify-end gap-3 pt-4 border-t border-surface-300-700">
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
