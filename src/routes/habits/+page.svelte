<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import { fade, fly } from 'svelte/transition';
	import { Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { routes } from '$lib/routes';
	import { habitsStore } from '$lib/stores/habits';
	import type { Habit } from '$lib/types/habit';

	export let data;

	// Initialize from SSR data
	let progressiveHabitList: Habit[] = data.progressiveHabitList;
	let singleStepHabitList: Habit[] = data.singleStepHabitList;
	let habitsLoading = false;
	let habitsError: string | null = null;

	let habitType: 0 | 1 = 0; //0 for progressive habit, 1 for single-step habit
	let isNewBtnClicked = false;
	let quote = data.quote ?? 'Let your days echo with the steps you choose to take.';
	let author = data.author ?? '';
	let isQuoteLoading = !data.quote;

	if (browser) {
		// Prefer SSR-provided quote, fall back to cached client quote
		if (!data.quote) {
			const cachedQuoteRaw = sessionStorage.getItem('uhabit-quote');
			if (cachedQuoteRaw) {
				try {
					const cached = JSON.parse(cachedQuoteRaw) as { quote?: string; author?: string };
					if (cached.quote) {
						quote = cached.quote;
						author = cached.author ?? '';
						isQuoteLoading = false;
					}
				} catch (e) {
					console.error('Failed to parse cached quote', e);
					sessionStorage.removeItem('uhabit-quote');
				}
			}
		} else {
			sessionStorage.setItem('uhabit-quote', JSON.stringify({ quote, author }));
		}
	}

	// Read hash on mount to restore tab state
	onMount(() => {
		const hash = window.location.hash;
		if (hash === '#single-step') {
			habitType = 1;
		}

		// Initialize store with SSR data, then subscribe for future updates
		habitsStore.init(data.progressiveHabitList, data.singleStepHabitList);

		const unsubscribe = habitsStore.subscribe((state) => {
			progressiveHabitList = state.progressive;
			singleStepHabitList = state.single;
			habitsLoading = state.loading;
			habitsError = state.error;
		});

		// Fetch quote client-side so SSR isn't blocked
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 1200);

		fetch('/api-external/quotes', { signal: controller.signal })
			.then(
				(res) => (res.ok ? res.json() : null) as Promise<{ quote?: string; author?: string } | null>
			)
			.then((data) => {
				if (data?.quote) {
					quote = data.quote;
					author = data.author ?? '';
					sessionStorage.setItem('uhabit-quote', JSON.stringify({ quote, author }));
				}
			})
			.catch(() => {
				// Keep fallback quote on error/timeout
			})
			.finally(() => {
				isQuoteLoading = false;
				clearTimeout(timeout);
			});

		return () => {
			controller.abort();
			unsubscribe();
		};
	});

	function handleHabitTypeChange(event: CustomEvent<0 | 1>) {
		habitType = event.detail;
		// Update URL hash to preserve state
		const hash = habitType === 1 ? '#single-step' : '#progressive';
		history.replaceState(null, '', hash);
	}
</script>

<div class="max-w-3xl mx-auto px-6 py-8">
	<!-- Quote -->
	{#if !isQuoteLoading}
		<p class="text-surface-500 text-sm italic mb-8 text-center">
			"{quote}"{#if author}<span class="text-surface-400"> — {author}</span>{/if}
		</p>
	{/if}

	<!-- ToggleBar -->
	<div class="flex justify-center mb-6">
		<ToggleBar {habitType} on:change={handleHabitTypeChange} />
	</div>

	<!-- Habit List -->
	<div class="border border-surface-200-800 rounded-lg overflow-hidden shadow-md">
		{#if habitsLoading}
			{#each Array(4) as _}
				<div class="h-14 border-b border-surface-200-800 animate-pulse bg-surface-100-900"></div>
			{/each}
		{:else if habitsError}
			<p class="py-8 text-center text-sm text-surface-500">{habitsError}</p>
		{:else if habitType === 0}
			{#if progressiveHabitList.length === 0}
				<p class="py-8 text-center text-sm text-surface-500">No progressive habits yet</p>
			{:else}
				{#each progressiveHabitList as habit}
					<HabitCard title={habit.title} habitId={habit.id} type={'progressive'} />
				{/each}
			{/if}
		{:else}
			{#if singleStepHabitList.length === 0}
				<p class="py-8 text-center text-sm text-surface-500">No single-step habits yet</p>
			{:else}
				{#each singleStepHabitList as habit}
					<HabitCard title={habit.title} habitId={habit.id} type={'single'} />
				{/each}
			{/if}
		{/if}
	</div>

	<!-- blur layer -->
	{#if isNewBtnClicked}
		<div
			on:click={() => {
				isNewBtnClicked = !isNewBtnClicked;
			}}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				e.key === 'Enter' ? (isNewBtnClicked = !isNewBtnClicked) : null;
			}}
			class="fixed inset-0 bg-surface-950/20"
			transition:fade={{ duration: 200 }}
		></div>
	{/if}

	<!-- add new habit btn -->
	<div class="fixed bottom-6 right-6 flex flex-col items-end gap-2">
		{#if isNewBtnClicked}
			<button
				class="px-4 py-2 text-sm bg-surface-800-100 text-surface-50-900 rounded-full hover:opacity-90 shadow-md hover:shadow-lg transition-all"
				transition:fly={{ y: 10, duration: 150 }}
				on:click={() => goto(routes.habits.new('progressive'))}
			>
				Progressive
			</button>
			<button
				class="px-4 py-2 text-sm bg-surface-800-100 text-surface-50-900 rounded-full hover:opacity-90 shadow-md hover:shadow-lg transition-all"
				transition:fly={{ y: 10, duration: 100 }}
				on:click={() => goto(routes.habits.new('single'))}
			>
				Single-Step
			</button>
		{/if}
		<button
			class="size-11 rounded-full bg-surface-900-50 text-surface-50-900 flex items-center justify-center hover:opacity-80 hover:glow-primary shadow-lg hover:shadow-xl transition-all"
			on:click={() => {
				isNewBtnClicked = !isNewBtnClicked;
			}}
		>
			<Plus
				size={28}
				strokeWidth={2}
				class="transition-transform duration-200 {isNewBtnClicked ? 'rotate-45' : 'rotate-0'}"
			/>
		</button>
	</div>
</div>
