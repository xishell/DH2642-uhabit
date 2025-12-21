<script lang="ts">
	import Modal from './Modal.svelte';
	import HabitModal from './HabitModal.svelte';
	import GoalHabitsSelector from './GoalHabitsSelector.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import DateInput from './DateInput.svelte';
	import FormField from './FormField.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import type {
		Goal,
		GoalWithHabits,
		GoalWithHabitStatus,
		GoalWithProgress
	} from '$lib/types/goal';
	import type { Habit, HabitWithStatus } from '$lib/types/habit';
	import { PASTEL_COLORS, DEFAULT_COLOR_INDEX } from '$lib/constants';
	import { z } from 'zod';
	import { toaster } from '$lib/stores/toaster';

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

	// Validation schema matching server-side validation
	const goalSchema = z
		.object({
			title: z
				.string()
				.min(1, 'Title is required')
				.max(255, 'Title must be 255 characters or less'),
			description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
			startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date is required'),
			endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date is required')
		})
		.refine((data) => new Date(data.endDate) > new Date(data.startDate), {
			message: 'End date must be after start date',
			path: ['endDate']
		});

	const isEditMode = $derived(!!goal);
	const modalTitle = $derived(isEditMode ? 'Edit Goal' : 'New Goal');

	// Get habits attached to the goal (if editing)
	const goalHabits = $derived((): Habit[] => {
		if (!goal || !('habits' in goal) || !goal.habits) return [];
		const habits = goal.habits as (Habit | HabitWithStatus)[];
		return habits.map((h) => ('habit' in h ? h.habit : h));
	});

	// Color options (same as habits for consistency)
	const colors = PASTEL_COLORS;

	// Form state
	let title = $state('');
	let description = $state('');
	let selectedColor = $state(colors[DEFAULT_COLOR_INDEX]);
	let startDate = $state('');
	let endDate = $state('');
	let selectedHabitIds = $state<Set<string>>(new Set());

	let isSubmitting = $state(false);
	let showDeleteConfirm = $state(false);

	// Field-level errors for accessibility
	let fieldErrors = $state<Record<string, string | null>>({
		title: null,
		description: null,
		startDate: null,
		endDate: null
	});

	function validateField(field: 'title' | 'description' | 'startDate' | 'endDate') {
		const data = {
			title: title.trim(),
			description: description.trim() || undefined,
			startDate,
			endDate
		};

		const result = goalSchema.safeParse(data);
		if (!result.success) {
			const fieldError = result.error.issues.find((issue) => issue.path[0] === field);
			fieldErrors[field] = fieldError?.message ?? null;
		} else {
			fieldErrors[field] = null;
		}
	}

	function clearFieldError(field: string) {
		fieldErrors[field] = null;
	}

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
				selectedColor = goal.color ?? colors[DEFAULT_COLOR_INDEX];
				startDate = formatDateForInput(goal.startDate);
				endDate = formatDateForInput(goal.endDate);
				// Pre-select habits attached to the goal
				selectedHabitIds = new Set(goalHabits().map((h) => h.id));
			} else {
				title = '';
				description = '';
				selectedColor = colors[DEFAULT_COLOR_INDEX];
				// Default to today and one month from now
				const today = new Date();
				const oneMonthLater = new Date();
				oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
				startDate = formatDateForInput(today);
				endDate = formatDateForInput(oneMonthLater);
				selectedHabitIds = new Set();
			}
			fieldErrors = { title: null, description: null, startDate: null, endDate: null };
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

		// Validate all fields with Zod
		const formData = {
			title: title.trim(),
			description: description.trim() || undefined,
			startDate,
			endDate
		};

		const result = goalSchema.safeParse(formData);
		if (!result.success) {
			// Map errors to field-level errors
			const newFieldErrors: Record<string, string | null> = {
				title: null,
				description: null,
				startDate: null,
				endDate: null
			};
			result.error.issues.forEach((issue) => {
				const field = issue.path[0] as string;
				if (field in newFieldErrors) {
					newFieldErrors[field] = issue.message;
				}
			});
			fieldErrors = newFieldErrors;
			toaster.error({
				title: 'Validation error',
				description: result.error.issues[0]?.message ?? 'Please fix the errors above'
			});
			return;
		}

		isSubmitting = true;

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
			toaster.error({
				title: 'Failed to save goal',
				description: err instanceof Error ? err.message : 'An unexpected error occurred'
			});
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
		<div class="flex flex-col gap-4">
			<FormField id="goal-title" label="Title" required error={fieldErrors.title}>
				<input
					id="goal-title"
					type="text"
					class="border rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
					class:border-surface-400-600={!fieldErrors.title}
					class:border-error-500={fieldErrors.title}
					placeholder="e.g. Get healthier this month"
					bind:value={title}
					onblur={() => validateField('title')}
					onfocus={() => clearFieldError('title')}
					aria-required="true"
					aria-invalid={!!fieldErrors.title}
					aria-describedby={fieldErrors.title ? 'goal-title-error' : undefined}
				/>
			</FormField>
			<FormField id="goal-description" label="Description" error={fieldErrors.description}>
				<textarea
					id="goal-description"
					class="w-full rounded-md border px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
					class:border-surface-400-600={!fieldErrors.description}
					class:border-error-500={fieldErrors.description}
					rows="2"
					placeholder="Describe your goal..."
					bind:value={description}
					onblur={() => validateField('description')}
					onfocus={() => clearFieldError('description')}
					aria-invalid={!!fieldErrors.description}
					aria-describedby={fieldErrors.description ? 'goal-description-error' : undefined}
				></textarea>
			</FormField>

			<ColorPicker {colors} {selectedColor} onSelect={(c) => (selectedColor = c)} />

			<div class="grid grid-cols-2 gap-4">
				<DateInput
					id="goal-start"
					label="Start Date"
					bind:value={startDate}
					hasError={!!fieldErrors.startDate}
					errorId="goal-start-error"
					onblur={() => validateField('startDate')}
					onfocus={() => clearFieldError('startDate')}
				>
					{#snippet error()}{#if fieldErrors.startDate}<p
								id="goal-start-error"
								class="text-error-500 text-xs mt-1"
								role="alert"
							>
								{fieldErrors.startDate}
							</p>{/if}{/snippet}
				</DateInput>
				<DateInput
					id="goal-end"
					label="End Date"
					bind:value={endDate}
					min={startDate}
					hasError={!!fieldErrors.endDate}
					errorId="goal-end-error"
					onblur={() => validateField('endDate')}
					onfocus={() => clearFieldError('endDate')}
				>
					{#snippet error()}{#if fieldErrors.endDate}<p
								id="goal-end-error"
								class="text-error-500 text-xs mt-1"
								role="alert"
							>
								{fieldErrors.endDate}
							</p>{/if}{/snippet}
				</DateInput>
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
					class="px-4 py-2 text-sm rounded-md border border-error-500 text-error-600 hover:bg-error-50 dark:hover:bg-error-950 transition-colors"
					onclick={() => (showDeleteConfirm = true)}
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

<ConfirmDialog
	open={showDeleteConfirm && !!goal?.id && !!ondelete}
	title="Delete Goal"
	confirmLabel="Delete"
	oncancel={() => (showDeleteConfirm = false)}
	onconfirm={() => {
		showDeleteConfirm = false;
		ondelete?.(goal!.id!);
	}}
>
	Are you sure you want to delete "<strong>{goal?.title}</strong>"? This action cannot be undone.
</ConfirmDialog>
