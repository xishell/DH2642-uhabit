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
		onsave
	}: {
		open: boolean;
		habit?: Habit | null;
		onclose: () => void;
		onsave: (habit: Partial<Habit>) => void;
	} = $props();

	const isEditMode = $derived(!!habit);
	const modalTitle = $derived(isEditMode ? 'Edit Habit' : 'New Habit');

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
	const frequencyArr = ['daily', 'weekly', 'monthly'] as const;

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

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!title.trim()) {
			error = 'Title is required';
			return;
		}

		isSubmitting = true;
		error = null;

		// Derive measurement type from form data
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
			<p class="text-red-600 text-sm text-center">{error}</p>
		{/if}

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<!-- Left column -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="habit-title" class="text-sm font-medium"
						>Title <span class="text-red-500">*</span></label
					>
					<input
						id="habit-title"
						type="text"
						class="border border-surface-300-600 rounded-md px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
						placeholder="e.g. drink water"
						bind:value={title}
						required
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="habit-notes" class="text-sm font-medium">Notes</label>
					<textarea
						id="habit-notes"
						class="w-full rounded-md border border-surface-300-600 px-3 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
								class="w-8 h-8 rounded-full border-2 transition-all duration-200"
								style="background-color: {color};"
								style:border-color={selectedColor === color ? selectedColor : 'transparent'}
								onclick={() => selectColor(color)}
								aria-label={`Select color ${color}`}
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right column -->
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium">Frequency</span>
					<div class="flex gap-2">
						{#each frequencyArr as frequency}
							<button
								type="button"
								class="btn capitalize text-sm px-3 py-1.5 rounded-md border transition-colors duration-200"
								class:bg-primary-500={selectedFrequency === frequency}
								class:text-white={selectedFrequency === frequency}
								class:border-primary-500={selectedFrequency === frequency}
								class:border-surface-300-600={selectedFrequency !== frequency}
								onclick={() => (selectedFrequency = frequency)}
							>
								{frequency}
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
							class="border border-surface-300-600 w-24 h-10 rounded-md text-sm px-3 bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
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
		<div class="flex justify-end gap-3 pt-4 border-t border-surface-200-700">
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
				{isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Habit'}
			</button>
		</div>
	</form>
</Modal>
