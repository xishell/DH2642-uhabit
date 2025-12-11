<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import { fade } from 'svelte/transition';
	import { Plus } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { routes } from '$lib/routes';
	import { createHabitsPresenter } from '$lib/presenters/habitsPresenter';

	let { data }: { data: any } = $props();

	const initialData = untrack(() => ({
		progressiveHabitList: data.progressiveHabitList,
		singleStepHabitList: data.singleStepHabitList,
		quote: data.quote,
		author: data.author,
		initialTab: data.initialTab
	}));

	const presenter = createHabitsPresenter({
		initial: initialData,
		fetcher: fetch,
		browser,
		storage: browser ? sessionStorage : null
	});

	const state = presenter.state;

	$effect(() => presenter.initHabits(data.progressiveHabitList, data.singleStepHabitList));

	$effect(() => {
		if (browser) {
			presenter.ensureQuote();
		}
	});
</script>

<div class="planning-view flex flex-col items-center p-7 max-w-[800px] m-auto">
	<!-- page title -->
	<h3 class="text-2xl self-start">Plan UHabit</h3>

	<!-- motivation-card -->
	<div
		class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-primary-300-700 text-white opacity-80 rounded-[10px]"
	>
		{#if $state.isQuoteLoading}
			<div class="w-full max-w-[560px] space-y-3 animate-pulse">
				<div class="h-5 w-4/5 mx-auto rounded-full bg-white/25"></div>
				<div class="h-5 w-11/12 mx-auto rounded-full bg-white/15"></div>
				<div class="h-4 w-1/3 mx-auto rounded-full bg-white/20"></div>
			</div>
		{:else}
			<p class="leading-snug">
				"{$state.quote}"
				{#if $state.author}
					<br />
					<span class="text-sm opacity-80">— {$state.author}</span>
				{/if}
			</p>
		{/if}
	</div>

	<!-- ToggleBar -->
	<ToggleBar habitType={$state.habitType} onChange={presenter.setHabitType} />

	<!-- Habit List -->
	<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
		{#if $state.habitsLoading}
			{#each Array(4) as _}
				<div class="h-24 rounded-xl bg-surface-200 dark:bg-surface-700 animate-pulse"></div>
			{/each}
		{:else if $state.habitsError}
			<p class="col-span-full text-center text-sm text-red-600">{$state.habitsError}</p>
		{:else if $state.habitType === 0}
			{#each $state.progressiveHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'progressive'} />
			{/each}
		{:else}
			{#each $state.singleStepHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'single'} />
			{/each}
		{/if}
	</div>

	<!-- blur layer -->
	{#if $state.isNewBtnClicked}
		<div
			onclick={presenter.toggleNewButton}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				e.key === 'Enter' ? presenter.toggleNewButton() : null;
			}}
			class="fixed top-0 w-full h-screen bg-gray-900 opacity-30"
			transition:fade={{ duration: 300 }}
		></div>
	{/if}

	<!-- add new habit btn -->
	<div
		class="new-btn-ctn fixed bottom-[40px] right-[45px] flex flex-col gap-4 justify-between items-end text-surface-50"
	>
		{#if $state.isNewBtnClicked}
			<div class="flex h-[90px] flex-col justify-between" transition:fade={{ duration: 300 }}>
				<a
					href={routes.habits.new('progressive')}
					data-sveltekit-preload-data="hover"
					class="text-sm bg-primary-500 rounded-[50px] py-2 px-4 hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl"
				>
					Progressive
				</a>
				<a
					href={routes.habits.new('single')}
					data-sveltekit-preload-data="hover"
					class="text-sm bg-primary-500 rounded-[50px] py-2 px-4 hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl"
				>
					Single-Step
				</a>
			</div>
		{/if}
		<button
			class="text-3xl w-[64px] h-[64px] bg-primary-500 rounded-full hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl flex justify-center items-center"
			onclick={presenter.toggleNewButton}
			><Plus
				size={26}
				strokeWidth={3}
				class={`pl-[0.04rem] pt-[0.04rem]
          transition-transform duration-300 ease-in-out
          ${$state.isNewBtnClicked ? 'rotate-45' : 'rotate-0'}`}
			/></button
		>
	</div>
</div>
