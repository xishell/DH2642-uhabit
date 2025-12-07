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

	export let data: { targetHabit?: Habit; loadError?: string } = {};
	export let form;

	let targetHabit: Habit | null = data?.targetHabit ?? null;
	let loadError: string | null = data?.loadError ?? null;
	let isLoading = !targetHabit && !loadError;
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
	<div class="max-w-xl mx-auto px-6 py-8">
		<h1 class="text-xl font-semibold mb-8">Edit Habit</h1>

		{#if form?.error}
			<div class="p-3 mb-6 border border-error-500 text-error-500 rounded-lg text-sm">{form.error}</div>
		{/if}
		{#if loadError}
			<div class="p-3 mb-6 border border-error-500 text-error-500 rounded-lg text-sm">{loadError}</div>
		{:else if !targetHabit && !isLoading}
			<p class="text-sm text-surface-500">Habit not found.</p>
		{:else}
			<div class="space-y-6">
				{#if isLoading}
					<div class="space-y-6 animate-pulse">
						<div class="h-4 w-16 bg-surface-200-700 rounded"></div>
						<div class="h-8 w-full bg-surface-200-700 rounded"></div>
						<div class="h-4 w-16 bg-surface-200-700 rounded"></div>
						<div class="h-20 w-full bg-surface-200-700 rounded"></div>
						<div class="h-4 w-16 bg-surface-200-700 rounded"></div>
						<div class="h-6 w-40 bg-surface-200-700 rounded"></div>
					</div>
				{:else if targetHabit}
					<label class="block relative">
						<span class="text-sm text-surface-500 mb-1.5 block">Title</span>
						<div class="relative">
							<input
								type="text"
								class="w-full border-b border-surface-300-600 bg-transparent py-2 text-sm focus:outline-none transition-colors relative z-10"
								placeholder="e.g. drink water"
								name="title"
								bind:value={targetHabit.title}
								required
								on:focus={(e) => {
									const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
									if (glow) {
										glow.classList.remove('glow-out');
										glow.classList.add('glow-in');
									}
								}}
								on:blur={(e) => {
									const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
									if (glow) {
										glow.classList.remove('glow-in');
										glow.classList.add('glow-out');
									}
								}}
							/>
							<div class="border-glow absolute bottom-0 left-0 w-full h-[2px] bg-primary-500 z-20"></div>
						</div>
					</label>

					<label class="block relative">
						<span class="text-sm text-surface-500 mb-1.5 block">Notes</span>
						<div class="relative">
							<textarea
								class="w-full border-b border-surface-300-600 bg-transparent py-2 text-sm focus:outline-none transition-colors resize-none relative z-10"
								rows="3"
								placeholder="Optional notes..."
								name="notes"
								bind:value={targetHabit.notes}
								on:focus={(e) => {
									const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
									if (glow) {
										glow.classList.remove('glow-out');
										glow.classList.add('glow-in');
									}
								}}
								on:blur={(e) => {
									const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
									if (glow) {
										glow.classList.remove('glow-in');
										glow.classList.add('glow-out');
									}
								}}
							></textarea>
							<div class="border-glow absolute bottom-0 left-0 w-full h-[2px] bg-primary-500 z-20"></div>
						</div>
					</label>

					<div>
						<span class="text-sm text-surface-500 mb-3 block">Color</span>
						<div class="flex gap-2">
							{#each colors as color}
								<button
									type="button"
									class="size-6 rounded-full transition-all duration-200 {selectedColor === color ? 'ring-2 ring-offset-2 ring-surface-400' : ''}"
									style="background-color: {color};"
									on:click={() => selectColor(color)}
									aria-label={`Select color ${color}`}
								></button>
							{/each}
						</div>
						<input type="hidden" name="color" value={selectedColor} />
					</div>

					<div>
						<span class="text-sm text-surface-500 mb-3 block">Frequency</span>
						<div class="flex gap-4 mb-4">
							{#each frequencyArr as frequency}
								<button
									type="button"
									class="text-sm capitalize pb-1 border-b-2 transition-colors duration-200
										{selectedFrequency === frequency ? 'border-surface-900-50 text-surface-900-50' : 'border-transparent text-surface-400 hover:text-surface-600-300'}"
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
						{/if}
						<input type="hidden" name="frequency" value={selectedFrequency} />
					</div>

					{#if measurement === 'numeric'}
						<div>
							<span class="text-sm text-surface-500 mb-1.5 block">Target</span>
							<div class="flex gap-3 items-center">
								<div class="relative">
									<input
										type="number"
										class="w-20 border-b border-surface-300-600 bg-transparent py-2 text-sm text-right focus:outline-none transition-colors relative z-10"
										placeholder="100"
										name="targetAmount"
										bind:value={targetHabit.targetAmount}
										required
										min="1"
										on:focus={(e) => {
											const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
											if (glow) {
												glow.classList.remove('glow-out');
												glow.classList.add('glow-in');
											}
										}}
										on:blur={(e) => {
											const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
											if (glow) {
												glow.classList.remove('glow-in');
												glow.classList.add('glow-out');
											}
										}}
									/>
									<div class="border-glow absolute bottom-0 left-0 w-full h-[2px] bg-primary-500 z-20"></div>
								</div>
								<SelectOrEdit {unit} required />
							</div>
						</div>
					{/if}
					<input type="hidden" name="measurement" value={measurement} />
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-3 mt-10 pt-6 border-t border-surface-200-800">
			<button
				type="button"
				class="text-sm text-surface-500 hover:text-surface-900-50 transition-colors"
				on:click={() => goto(routes.habits.list)}
			>
				Cancel
			</button>
			<button
				type="button"
				class="text-sm text-error-500 hover:text-error-400 transition-colors flex items-center gap-1"
				on:click={handleDelete}
			>
				<Trash2 size={14} />
				Delete
			</button>
			<button
				type="submit"
				class="ml-auto px-4 py-2 text-sm font-medium bg-surface-900-50 text-surface-50-900 rounded-lg hover:opacity-80 shadow-md hover:shadow-lg transition-all"
			>
				Save
			</button>
		</div>
	</div>
</form>
