<script lang="ts">
	import Modal from './Modal.svelte';
	import SelectWeekDay from './SelectWeekDay.svelte';
	import SelectMonthDay from './SelectMonthDay.svelte';
	import SelectOrEdit from './SelectOrEdit.svelte';
	import type { Habit } from '$lib/types/habit';

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

	const isEditMode = $derived(!!habit);
	const modalTitle = $derived(isEditMode ? 'Edit Habit' : 'New Habit');

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
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
	let error = $state<string | null>(null);

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
			error = null;
		}
	});

	function selectColor(color: string) {
		selectedColor = color;
	}

	function validateForm(): string | null {
		if (!title.trim()) return 'Title is required';
		return null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const validationError = validateForm();
		if (validationError) {
			error = validationError;
			return;
		}

		isSubmitting = true;
		error = null;

		const hasTarget = targetAmount !== null && targetAmount > 0;
		const hasUnit = unit.trim() !== '';
		const isNumeric = hasTarget && hasUnit;

		const habitData: Partial<Habit> = {
			title: title.trim(),
			notes: notes.trim() || null,
			color: selectedColor,
			frequency: selectedFrequency as Habit['frequency'],
			period: selectedFrequency !== 'daily' ? period : null,
			measurement: isNumeric ? 'numeric' : 'boolean',
			targetAmount: isNumeric ? targetAmount : null,
			unit: isNumeric ? unit.trim() : null
		};

		if (habit?.id) {
			habitData.id = habit.id;
		}

		try {
			await onsave(habitData);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save habit';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Modal {open} title={modalTitle} {onclose}>
	<form onsubmit={handleSubmit} class="flex flex-col gap-6">
		{#if error}
			<p class="text-error-600 text-sm text-center">{error}</p>
		{/if}

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<!-- Left column: Title, Notes, Color -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="habit-title" class="text-sm font-medium"
						>Title <span class="text-error-500">*</span></label
					>
					<input
						id="habit-title"
						type="text"
						class="border border-surface-400-600 rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						placeholder="e.g. drink water"
						bind:value={title}
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="habit-notes" class="text-sm font-medium">Notes</label>
					<textarea
						id="habit-notes"
						class="w-full rounded-md border border-surface-400-600 px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
						rows="3"
						placeholder="Write down your notes for this habit..."
						bind:value={notes}
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
								onclick={() => selectColor(color)}
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
					<p class="text-xs text-surface-500">Set a target amount to track progress</p>
					<div class="flex gap-3 mt-1">
						<input
							type="number"
							class="border border-surface-400-600 w-24 h-10 rounded-md text-sm px-3 bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
							placeholder="100"
							bind:value={targetAmount}
							min="1"
						/>
						<SelectOrEdit bind:unit />
					</div>
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
