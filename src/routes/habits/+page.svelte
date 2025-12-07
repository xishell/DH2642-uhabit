<script lang="ts">
	import ToggleBar from '$lib/components/ToggleBar.svelte';
	import HabitCard from '$lib/components/HabitCard.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import { fade } from 'svelte/transition';
	import { Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { routes } from '$lib/routes';
	export let data;

	const { progressiveHabitList, singleStepHabitList } = data;

	let habitType: 0 | 1 = 0; //0 for progressive habit, 1 for single-step habit
	let isNewBtnClicked = false;

	// Read hash on mount to restore tab state
	onMount(() => {
		const hash = window.location.hash;
		if (hash === '#single-step') {
			habitType = 1;
		}
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
		class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-gray-200 rounded-[10px]"
	>
		“Let your days echo with the steps you choose to take.”
	</div>

	<!-- ToggleBar -->
	<ToggleBar {habitType} on:change={handleHabitTypeChange} />

	<!-- Habit List -->
	{#if habitType === 0}
		<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
			{#each progressiveHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'progressive'} />
			{/each}
		</div>
	{:else}
		<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
			{#each singleStepHabitList as habit}
				<HabitCard title={habit.title} habitId={habit.id} type={'single'} />
			{/each}
		</div>
	{/if}

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
		class="new-btn-ctn fixed bottom-[40px] right-[45px] flex flex-col gap-4 justify-between items-end"
	>
		{#if isNewBtnClicked}
			<div class="flex h-[90px] flex-col justify-between" transition:fade={{ duration: 300 }}>
				<button
					class="text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-xl"
					on:click={() => goto(routes.habits.new('progressive'))}
				>
					Progressive
				</button>
				<button
					class="text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-xl"
					on:click={() => goto(routes.habits.new('single'))}
				>
					Single-Step
				</button>
			</div>
		{/if}
		<button
			class="text-3xl w-[64px] h-[64px] bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-300 cursor-pointer shadow-xl flex justify-center items-center"
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
