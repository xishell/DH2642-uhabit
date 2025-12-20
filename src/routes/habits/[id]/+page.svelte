<script lang="ts">
	import SelectWeekDay from '$lib/components/SelectWeekDay.svelte';
	import SelectMonthDay from '$lib/components/SelectMonthDay.svelte';
	import SelectOrEdit from '$lib/components/SelectOrEdit.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';
	import { Trash2 } from 'lucide-svelte';
	import type { Habit } from '$lib/types/habit';
	import { untrack } from 'svelte';

	let {
		data = {},
		form
	}: {
		data?: { targetHabit?: Habit; loadError?: string };
		form?: any;
	} = $props();

	let targetHabit = $state<Habit | null>(untrack(() => data?.targetHabit ?? null));
	let loadError = $state<string | null>(untrack(() => data?.loadError ?? null));
	let isLoading = $state(untrack(() => !targetHabit && !loadError));

	const id = $derived($page.params.id);

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
	const frequencyArr = ['daily', 'weekly', 'monthly'];

	let selectedColor = $state<string | null>(untrack(() => targetHabit?.color ?? null));
	let selectedFrequency = $state<string | null>(untrack(() => targetHabit?.frequency ?? 'daily'));
	let unit = $state<string | null>(untrack(() => targetHabit?.unit ?? null));

	$effect(() => {
		// If SSR provided data or error, skip client fetch
		if (targetHabit || loadError) {
			isLoading = false;
			return;
		}

		fetch(`/api/habits/${id}`)
			.then((res) => (res.ok ? res.json() : null) as Promise<Habit | null>)
			.then((habit) => {
				if (habit) {
					targetHabit = habit;
					selectedColor = habit.color;
					selectedFrequency = habit.frequency;
					unit = habit.unit;
				} else {
					loadError = 'Habit not found';
				}
			})
			.catch(() => {
				loadError = 'Failed to load habit';
			})
			.finally(() => {
				isLoading = false;
			});
	});

	function selectColor(color: string) {
		selectedColor = color;
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
			return;
		}

		try {
			const res = await fetch(`/api/habits/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				goto(routes.habits.list);
			} else {
				alert('Failed to delete habit. Please try again.');
			}
		} catch (error) {
			alert('Failed to delete habit. Please try again.');
		}
	}
</script>

<form method="POST">
	<div class="add-habit-view w-full flex flex-col gap-12 p-7 max-w-[800px] m-auto">
		<h1 class="hidden sm:block text-center text-xl">Edit Habit</h1>
		{#if form?.error}
			<p class="text-error-600 text-sm text-center">{form.error}</p>
		{/if}
		{#if loadError}
			<p class="text-error-600 text-sm text-center">{loadError}</p>
		{:else if !targetHabit && !isLoading}
			<p class="text-sm text-center">Habit not found.</p>
		{:else}
			<!-- form body -->
			<div
				class="form-info grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-2 sm:border sm:border-surface-300 dark:sm:border-surface-600 sm:rounded-xl sm:py-[50px] sm:px-[50px]"
			>
				{#if isLoading}
					<!-- Skeletons -->
					<div
						class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-surface-300 dark:sm:border-r-surface-600 sm:border-r animate-pulse"
					>
						<div class="h-5 w-1/2 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						<div class="h-5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-24 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						<div class="h-5 w-1/4 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
					</div>
					<div class="additional-info flex flex-col gap-3 sm:pl-[40px] animate-pulse">
						<div class="h-5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="space-y-2">
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						</div>
						<div class="h-5 w-1/4 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
					</div>
				{:else if targetHabit}
					<div
						class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-surface-300 dark:sm:border-r-surface-600 sm:border-r"
					>
						<span>Title <span class="text-error-500">*</span></span>
						<input
							type="text"
							class="border border-surface-300-600 rounded-md px-2 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
							placeholder="e.g. drink water"
							name="title"
							bind:value={targetHabit.title}
							required
						/>

						<span>Notes</span>
						<textarea
							class="w-full rounded-md border border-surface-300-600 px-2 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
							rows="4"
							placeholder="write down your notes for this habit..."
							name="notes"
							bind:value={targetHabit.notes}
						></textarea>

						<span>Color</span>
						<div class="color-picking-sec w-full h-10 rounded-md flex justify-between items-center">
							{#each colors as color}
								<button
									type="button"
									class="color-dot w-10 h-10 sm:w-9 sm:h-9 rounded-full border-2 p-[0.1rem] bg-clip-content transition-all duration-200"
									style="background-color: {color};"
									onclick={() => selectColor(color)}
									style:border-color={selectedColor === color ? selectedColor : 'transparent'}
									aria-label={`Select color ${color}`}
								></button>
							{/each}
						</div>
						<input type="hidden" name="color" value={selectedColor} />
					</div>

					<div class="additional-info flex flex-col gap-3 sm:pl-[40px] sm:border-l-surface-500">
						<span>Frequency</span>
						<div class="flex flex-col gap-2.5">
							<div class="w-full h-10 rounded-md flex justify-between items-center">
								{#each frequencyArr as frequency}
									<button
										type="button"
										class="btn capitalize preset-outlined-primary-700-300 border-primary-600 transition-colors duration-200 sm:text-sm"
										class:border-transparent={!(selectedFrequency === frequency)}
										class:text-primary-700={selectedFrequency === frequency}
										onclick={() => (selectedFrequency = frequency)}
									>
										{frequency}
									</button>
								{/each}
							</div>
							{#if selectedFrequency === 'weekly'}
								<SelectWeekDay selectDays={targetHabit?.period ?? []} />
							{:else if selectedFrequency === 'monthly'}
								<SelectMonthDay selectDays={targetHabit?.period ?? []} />
							{:else}{/if}
						</div>
						<input type="hidden" name="frequency" value={selectedFrequency} />

						<span>Target <span class="text-surface-400">(optional)</span></span>
						<p class="text-xs text-surface-500 -mt-1">Set a target amount to track progress</p>
						<div class="inputs-ctn flex gap-4">
							<input
								type="number"
								class="border border-surface-300-600 w-28 h-11 rounded-md text-base px-3 bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
								placeholder="100"
								name="targetAmount"
								bind:value={targetHabit.targetAmount}
								min="1"
							/>
							<SelectOrEdit {unit} />
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- confirmation btns -->
		<div class="form-btn flex justify-center gap-8">
			<a
				href={routes.habits.list}
				data-sveltekit-preload-data="hover"
				class="text-sm w-24 bg-secondary-200 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-full py-3 px-6 hover:bg-secondary-300 dark:hover:bg-secondary-700 transition-colors duration-200 cursor-pointer shadow-sm text-center"
			>
				Cancel
			</a>
			<button
				type="button"
				class="flex justify-center items-center w-12 h-12 rounded-full border border-surface-600-400 hover:text-surface-contrast-800 hover:bg-error-700 hover:border-error-700 transition-colors duration-300 cursor-pointer"
				onclick={handleDelete}><Trash2 strokeWidth={1.5} /></button
			>
			<button
				type="submit"
				class="text-sm w-24 bg-primary-200-800 text-primary-800-200 rounded-full py-3 px-6 hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer shadow-sm"
			>
				Edit
			</button>
		</div>
	</div>
</form>
