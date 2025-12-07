<script lang="ts">
	import { goto } from '$app/navigation';
	import { routes } from '$lib/routes';
	export let title: string = 'Drink Water';
	export let habitId: string = '';
	export let type: string = '';
</script>

<div
	class=" w-full h-[64px] rounded-[10px] border-[1.6px] border-primary-400-600 flex justify-between items-center px-[20px]"
>
	<span>{title}</span>
	<button
		on:click={() => goto(routes.habits.edit(habitId, type))}
		class="bg-primary-500 text-surface-50 rounded-[10px] py-2 px-6 hover:bg-primary-400 transition-all duration-200 cursor-pointer"
		>Edit</button
	>
</div>
