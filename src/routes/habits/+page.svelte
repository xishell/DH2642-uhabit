<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
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
				<HabitCard title={habit.title} habitId={habit.id} />
			{/each}
		{:else}
			{#each $state.singleStepHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} />
			{/each}
		{/if}
	</div>

	<!-- add new habit btn -->
	<a
		href={routes.habits.new}
		data-sveltekit-preload-data="hover"
		class="fixed bottom-[40px] right-[45px] text-3xl w-[64px] h-[64px] bg-primary-500 rounded-full hover:bg-primary-400 transition-colors duration-200 cursor-pointer shadow-xl flex justify-center items-center text-surface-50"
	>
		<Plus size={26} strokeWidth={3} class="pl-[0.04rem] pt-[0.04rem]" />
	</a>
</div>
