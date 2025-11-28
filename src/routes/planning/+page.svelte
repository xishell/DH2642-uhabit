<script lang="ts">
	import ToggleBar from './components/ToggleBar.svelte';
	import HabitCard from './components/HabitCard.svelte';
	import Btn from '$lib/components/Btn.svelte';
	const progressiveHabitList = [
		'Drink Water',
		'Read Book',
		'Play with cat',
		'take 10 pictures',
		'play computer games'
	];
	const singleStepHabitList = [
		'push up once',
		'practice dance',
		'write diary',
		'Meditation',
		'Walk in the woods',
		'wash clothes'
	];
	let habitType: 0 | 1 = 0; //0 for progressive habit, 1 for single-step habit
	let isNewBtnClicked = false;

	function handleHabitTypeChange(event: CustomEvent<0 | 1>) {
		habitType = event.detail;
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
				<HabitCard title={habit} />
			{/each}
		</div>
	{:else}
		<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
			{#each singleStepHabitList as habit}
				<HabitCard title={habit} />
			{/each}
		</div>
	{/if}

	<!-- add new habit btn -->
	<div
		class="new-btn-ctn absolute bottom-[40px] right-[45px] flex gap-1.5 justify-between items-center"
	>
		<button
			class="text-3xl w-[70px] h-[70px] bg-gray-300 rounded-full hover:bg-gray-200 transition-colors duration-300 cursor-pointer"
			on:click={() => {
				isNewBtnClicked = !isNewBtnClicked;
			}}>+</button
		>
		{#if isNewBtnClicked}
			<div class=" flex h-[90px] flex-col justify-between">
				<button
					class="text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer"
					>Progressive</button
				>
				<button
					class="text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer"
					>Single-Step</button
				>
			</div>
		{:else}
			<div class=" flex h-[90px] flex-col justify-between">
				<button
					class="opacity-0 text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer"
					>Progressive</button
				>
				<button
					class="opacity-0 text-sm bg-gray-200 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer"
					>Single-Step</button
				>
			</div>
		{/if}
	</div>
</div>
