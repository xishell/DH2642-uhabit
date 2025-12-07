<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import { fade } from 'svelte/transition';
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

<div class="planning-view flex flex-col items-center p-7 max-w-[800px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start">Plan UHabit</h3>

	<!-- motivation-card -->
	<div
		class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-primary-300-700 text-white opacity-80 rounded-[10px]"
	>
		{#if isQuoteLoading}
			<div class="w-full max-w-[560px] space-y-3 animate-pulse">
				<div class="h-5 w-4/5 mx-auto rounded-full bg-white/25"></div>
				<div class="h-5 w-11/12 mx-auto rounded-full bg-white/15"></div>
				<div class="h-4 w-1/3 mx-auto rounded-full bg-white/20"></div>
			</div>
		{:else}
			<p class="leading-snug">
				“{quote}”
				{#if author}
					<br />
					<span class="text-sm opacity-80">— {author}</span>
				{/if}
			</p>
		{/if}
	</div>

	<!-- ToggleBar -->
	<ToggleBar {habitType} on:change={handleHabitTypeChange} />

	<!-- Habit List -->
	<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
		{#if habitsLoading}
			{#each Array(4) as _}
				<div class="h-24 rounded-xl bg-surface-200 dark:bg-surface-700 animate-pulse"></div>
			{/each}
		{:else if habitsError}
			<p class="col-span-full text-center text-sm text-red-600">{habitsError}</p>
		{:else if habitType === 0}
			{#each progressiveHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'progressive'} />
			{/each}
		{:else}
			{#each singleStepHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'single'} />
			{/each}
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
			class="fixed top-0 w-full h-screen bg-gray-900 opacity-30"
			transition:fade={{ duration: 300 }}
		></div>
	{/if}

	<!-- add new habit btn -->
	<div
		class="new-btn-ctn fixed bottom-[40px] right-[45px] flex flex-col gap-4 justify-between items-end text-surface-50"
	>
		{#if isNewBtnClicked}
			<div class="flex h-[90px] flex-col justify-between" transition:fade={{ duration: 300 }}>
				<button
					class="text-sm bg-primary-500 rounded-[50px] py-2 px-4 hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl"
					on:click={() => goto(routes.habits.new('progressive'))}
				>
					Progressive
				</button>
				<button
					class="text-sm bg-primary-500 rounded-[50px] py-2 px-4 hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl"
					on:click={() => goto(routes.habits.new('single'))}
				>
					Single-Step
				</button>
			</div>
		{/if}
		<button
			class="text-3xl w-[64px] h-[64px] bg-primary-500 rounded-full hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl flex justify-center items-center"
			on:click={() => {
				isNewBtnClicked = !isNewBtnClicked;
			}}
			><Plus
				size={26}
				strokeWidth={3}
				class={`pl-[0.04rem] pt-[0.04rem] 
          transition-transform duration-300 ease-in-out
          ${isNewBtnClicked ? 'rotate-45' : 'rotate-0'}`}
			/></button
		>
	</div>
</div>
