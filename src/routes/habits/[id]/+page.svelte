<script lang="ts">
	import SelectWeekDay from '$lib/components/SelectWeekDay.svelte';
	import SelectMonthDay from '$lib/components/SelectMonthDay.svelte';
	import SelectOrEdit from '$lib/components/SelectOrEdit.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';
	import { Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { Habit } from '$lib/types/habit';

	export let data: { targetHabit?: Habit } = {};
	export let form;

	let targetHabit: Habit | null = data?.targetHabit ?? null;
	let isLoading = !targetHabit;
	let loadError: string | null = null;
	$: id = $page.params.id;
	$: type = $page.url.searchParams.get('type');

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
	const frequencyArr = ['daily', 'weekly', 'monthly'];

	$: measurement =
		type === 'progressive'
			? 'numeric'
			: type === 'single'
				? 'boolean'
				: (targetHabit?.measurement ?? 'boolean');

	let selectedColor: string | null = targetHabit?.color ?? null;
	let selectedFrequency: string | null = targetHabit?.frequency ?? 'daily';
	let unit: string | null = targetHabit?.unit ?? null;

	onMount(() => {
		// If no SSR data, fetch client-side
		if (targetHabit) {
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
</script>

<form method="POST">
	<div class="add-habit-view w-full flex flex-col gap-12 p-7 max-w-[800px] m-auto">
		<h1 class="hidden sm:block text-center text-xl">Edit Habit</h1>
		{#if form?.error}
			<p class="text-red-600 text-sm text-center">{form.error}</p>
		{/if}
		{#if loadError}
			<p class="text-red-600 text-sm text-center">{loadError}</p>
		{:else if !targetHabit && !isLoading}
			<p class="text-sm text-center">Habit not found.</p>
		{:else}
			<!-- form body -->
			<div
				class="form-info grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-2 sm:border sm:border-surface-500 sm:rounded-[10px] sm:py-[50px] sm:px-[50px]"
			>
				{#if isLoading}
					<!-- Skeletons -->
					<div
						class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-surface-500 sm:border-r animate-pulse"
					>
						<div class="h-5 w-1/2 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
						<div class="h-5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-24 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
						<div class="h-5 w-1/4 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
					</div>
					<div class="additional-info flex flex-col gap-3 sm:pl-[40px] animate-pulse">
						<div class="h-5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="space-y-2">
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
						</div>
						<div class="h-5 w-1/4 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-[12px]"></div>
					</div>
				{:else if targetHabit}
					<div
						class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-surface-500 sm:border-r"
					>
						<span>Title</span>
						<input
							type="text"
							class=" border border-primary-400-600 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							placeholder="e.g. drink water"
							name="title"
							bind:value={targetHabit.title}
						/>

						<span>Notes</span>
						<textarea
							class="w-full rounded-md border border-primary-400-600 px-2 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-primary-500"
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
									on:click={() => selectColor(color)}
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
										on:click={() => (selectedFrequency = frequency)}
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

						{#if measurement === 'numeric'}
							<span>Measurement</span>
							<div class="inputs-ctn flex gap-4">
								<input
									type="text"
									class="border border-primary-400-600 w-18 h-9 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right pr-2"
									placeholder="100"
									name="targetAmount"
									bind:value={targetHabit.targetAmount}
								/>
								<SelectOrEdit {unit} />
							</div>
						{/if}
						<input type="hidden" name="measurement" value={measurement} />
					</div>
				{/if}
			</div>
		{/if}

		<!-- confirmation btns -->
		<div class="form-btn flex justify-center gap-8">
			<button
				type="button"
				class="text-sm w-24 bg-primary-200-800 text-primary-800-200 rounded-[50px] py-3 px-6 hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer shadow-sm"
				on:click={() => goto(routes.habits.list)}
			>
				Cancel
			</button>
			<button
				type="button"
				class="flex justify-center items-center w-12 h-12 rounded-full border border-surface-600-400 hover:text-surface-contrast-800 hover:bg-error-700 hover:border-error-700 transition-colors duration-300 cursor-pointer"
				><Trash2 strokeWidth={1.5} /></button
			>
			<button
				type="submit"
				class="text-sm w-24 bg-primary-200-800 text-primary-800-200 rounded-[50px] py-3 px-6 hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer shadow-sm"
			>
				Edit
			</button>
		</div>
	</div>
</form>
