<script lang="ts">
	import Modal from './Modal.svelte';
	import SelectWeekDay from './SelectWeekDay.svelte';
	import SelectMonthDay from './SelectMonthDay.svelte';
	import SelectOrEdit from './SelectOrEdit.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import FormField from './FormField.svelte';
	import type { Habit } from '$lib/types/habit';
	import { z } from 'zod';
	import { toaster } from '$lib/stores/toaster';

	let {
		open = false,
		habit = null,
		onclose,
		onsave,
		ondelete
	}: {
		open: boolean;
		habit?: Habit | null;
		onclose: () => void;
		onsave: (habit: Partial<Habit>) => void;
		ondelete?: (habitId: string) => void;
	} = $props();

	// Validation schema matching server-side validation
	const habitSchema = z
		.object({
			title: z
				.string()
				.min(1, 'Title is required')
				.max(255, 'Title must be 255 characters or less'),
			notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
			targetAmount: z.number().int().positive('Target must be a positive number').nullable(),
			unit: z.string().max(50, 'Unit must be 50 characters or less').nullable()
		})
		.refine(
			(data) => {
				// If targetAmount is set, unit must also be set
				if (data.targetAmount !== null && data.targetAmount > 0) {
					return data.unit !== null && data.unit.trim() !== '';
				}
				return true;
			},
			{ message: 'Unit is required when target amount is set', path: ['unit'] }
		);

	const isEditMode = $derived(!!habit);
	const modalTitle = $derived(isEditMode ? 'Edit Habit' : 'New Habit');

	const colors = [
		'#BFD7EA', // pastel blue
		'#FFF1B6', // pastel yellow
		'#CDEAC0', // pastel green
		'#FFD6A5', // pastel orange
		'#FFADAD', // pastel red
		'#FBC4E2', // pastel pink
		'#DCC6E0' // pastel purple
	];

	const frequencyArr = [
		{ value: 'daily', label: 'Daily (every day)' },
		{ value: 'weekly', label: 'Weekly (choose days)' },
		{ value: 'monthly', label: 'Monthly (choose dates)' }
	] as const;

	// Form state
	let title = $state('');
	let notes = $state('');
	let selectedColor = $state(colors[2]);
	let selectedFrequency = $state<string>('daily');
	let targetAmount = $state<number | null>(null);
	let unit = $state('');
	let period = $state<number[]>([]);

	let isSubmitting = $state(false);

	// Field-level errors for accessibility
	let fieldErrors = $state<Record<string, string | null>>({
		title: null,
		notes: null,
		targetAmount: null,
		unit: null
	});

	function validateField(field: 'title' | 'notes' | 'targetAmount' | 'unit') {
		const data = {
			title: title.trim(),
			notes: notes.trim() || undefined,
			targetAmount: targetAmount,
			unit: unit.trim() || null
		};

		const result = habitSchema.safeParse(data);
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

	// Reset form when modal opens or habit changes
	$effect(() => {
		if (open) {
			if (habit) {
				title = habit.title;
				notes = habit.notes ?? '';
				selectedColor = habit.color ?? colors[2];
				selectedFrequency = habit.frequency;
				targetAmount = habit.targetAmount;
				unit = habit.unit ?? '';
				period = habit.period ?? [];
			} else {
				title = '';
				notes = '';
				selectedColor = colors[2];
				selectedFrequency = 'daily';
				targetAmount = null;
				unit = '';
				period = [];
			}
			fieldErrors = { title: null, notes: null, targetAmount: null, unit: null };
		}
	});

	function mapZodErrors(issues: z.ZodIssue[]): Record<string, string | null> {
		const errors: Record<string, string | null> = {
			title: null,
			notes: null,
			targetAmount: null,
			unit: null
		};
		issues.forEach((issue) => {
			const f = issue.path[0] as string;
			if (f in errors) errors[f] = issue.message;
		});
		return errors;
	}

	function buildHabitData(): Partial<Habit> {
		const isNumeric = targetAmount !== null && targetAmount > 0 && unit.trim() !== '';
		return {
			...(habit?.id && { id: habit.id }),
			title: title.trim(),
			notes: notes.trim() || null,
			color: selectedColor,
			frequency: selectedFrequency as Habit['frequency'],
			period: selectedFrequency !== 'daily' ? period : null,
			measurement: isNumeric ? 'numeric' : 'boolean',
			targetAmount: isNumeric ? targetAmount : null,
			unit: isNumeric ? unit.trim() : null
		};
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const formData = {
			title: title.trim(),
			notes: notes.trim() || undefined,
			targetAmount,
			unit: unit.trim() || null
		};
		const result = habitSchema.safeParse(formData);
		if (!result.success) {
			fieldErrors = mapZodErrors(result.error.issues);
			toaster.error({
				title: 'Validation error',
				description: result.error.issues[0]?.message ?? 'Please fix the errors above'
			});
			return;
		}
		isSubmitting = true;
		try {
			await onsave(buildHabitData());
		} catch (err) {
			toaster.error({
				title: 'Failed to save habit',
				description: err instanceof Error ? err.message : 'An unexpected error occurred'
			});
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {open} title={modalTitle} {onclose}>
	<form onsubmit={handleSubmit} class="flex flex-col gap-6">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<div class="flex flex-col gap-4">
				<FormField id="habit-title" label="Title" required error={fieldErrors.title}>
					<input
						id="habit-title"
						type="text"
						class="border rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						class:border-surface-400-600={!fieldErrors.title}
						class:border-error-500={fieldErrors.title}
						placeholder="e.g. drink water"
						bind:value={title}
						onblur={() => validateField('title')}
						onfocus={() => clearFieldError('title')}
						aria-required="true"
						aria-invalid={!!fieldErrors.title}
						aria-describedby={fieldErrors.title ? 'habit-title-error' : undefined}
					/>
				</FormField>
				<FormField id="habit-notes" label="Notes" error={fieldErrors.notes}>
					<textarea
						id="habit-notes"
						class="w-full rounded-md border px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						class:border-surface-400-600={!fieldErrors.notes}
						class:border-error-500={fieldErrors.notes}
						rows="3"
						placeholder="Write down your notes for this habit..."
						bind:value={notes}
						onblur={() => validateField('notes')}
						onfocus={() => clearFieldError('notes')}
						aria-invalid={!!fieldErrors.notes}
						aria-describedby={fieldErrors.notes ? 'habit-notes-error' : undefined}
					></textarea>
				</FormField>
				<ColorPicker {colors} {selectedColor} onSelect={(c) => (selectedColor = c)} />
			</div>

			<!-- Right column -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium">Schedule</span>
					<div class="flex gap-2">
						{#each frequencyArr as freq}
							<button
								type="button"
								class="btn capitalize text-sm px-3 py-1.5 rounded-md border transition-colors duration-200 bg-surface-200-800"
								class:bg-primary-500={selectedFrequency === freq.value}
								class:text-white={selectedFrequency === freq.value}
								class:border-primary-500={selectedFrequency === freq.value}
								class:border-surface-400-600={selectedFrequency !== freq.value}
								onclick={() => (selectedFrequency = freq.value)}
								title={freq.label}
							>
								{freq.value}
							</button>
						{/each}
					</div>
					{#if selectedFrequency === 'weekly'}
						<div class="mt-2">
							<SelectWeekDay bind:selectDays={period} />
						</div>
					{:else if selectedFrequency === 'monthly'}
						<div class="mt-2">
							<SelectMonthDay bind:selectDays={period} />
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium"
						>Target <span class="text-surface-400">(optional)</span></span
					>
					<p id="target-hint" class="text-xs text-surface-500">
						Set a target amount to track progress
					</p>
					<div class="flex gap-3 mt-1">
						<input
							id="habit-target"
							type="number"
							class="border w-24 h-10 rounded-md text-sm px-3 bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
							class:border-surface-400-600={!fieldErrors.targetAmount}
							class:border-error-500={fieldErrors.targetAmount}
							placeholder="100"
							bind:value={targetAmount}
							min="1"
							onblur={() => validateField('targetAmount')}
							onfocus={() => clearFieldError('targetAmount')}
							aria-invalid={!!fieldErrors.targetAmount}
							aria-describedby="target-hint{fieldErrors.targetAmount ? ' habit-target-error' : ''}"
						/>
						<SelectOrEdit
							bind:unit
							hasError={!!fieldErrors.unit}
							onblur={() => validateField('unit')}
							onfocus={() => clearFieldError('unit')}
						/>
					</div>
					{#if fieldErrors.targetAmount}
						<p id="habit-target-error" class="text-error-500 text-xs mt-1" role="alert">
							{fieldErrors.targetAmount}
						</p>
					{/if}
					{#if fieldErrors.unit}
						<p id="habit-unit-error" class="text-error-500 text-xs mt-1" role="alert">
							{fieldErrors.unit}
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3 pt-4 border-t border-surface-300-700">
			{#if habit?.id && ondelete}
				<button
					type="button"
					class="px-4 py-2 text-sm rounded-md border border-error-500 text-error-600 hover:bg-error-50 transition-colors"
					onclick={() => ondelete(habit.id!)}
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
				{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Habit'}
			</button>
		</div>
	</form>
</Modal>
