<script lang="ts">
	import ToggleBar from './components/ToggleBar.svelte';
	import HabitCard from './components/HabitCard.svelte';
	import Btn from '$lib/components/Btn.svelte';
	let habitList = ['Drink Water', 'Read Book', 'Play with cat', 'Meditation', 'Walk in the woods'];
</script>

<div class="planning-view flex flex-col items-center p-7 max-w-[800px] m-auto">
	<h3 class="text-2xl self-start">Plan UHabit</h3>
	<div
		class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-gray-200 rounded-[10px]"
	>
		“Let your days echo with the steps you choose to take.”
	</div>
	<ToggleBar />
	<div class="habit-list w-full grid grid-cols-1 sm:grid-cols-2 justify-between gap-7 mt-6">
		{#each habitList as habit}
			<HabitCard title={habit} />
		{/each}
	</div>
	<div class="new-btn-ctn absolute bottom-[40px] flex justify-between items-center">
		<Btn content="New" />
		<div class=" flex flex-col justify-between">
			<Btn content="Progressive" />
			<Btn content="Single-Step" />
		</div>
	</div>
</div>
