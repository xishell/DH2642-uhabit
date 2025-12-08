<script lang="ts">
	import { goto } from '$app/navigation';
	import { routes } from '$lib/routes';
	export let title: string = 'Drink Water';
	export let habitId: string = '';
	export let type: string = '';
</script>

<div
	class="w-full h-[64px] rounded-lg border-[1.5px] border-surface-700 bg-surface-800 flex justify-between items-center px-5 hover:bg-surface-700 transition-all duration-200"
>
	<span class="text-surface-50 font-medium">{title}</span>
	<button
		on:click={() => goto(routes.habits.edit(habitId, type))}
		class="bg-primary-500 text-surface-50 rounded-lg py-2 px-6 hover:bg-primary-400 transition-all duration-200 cursor-pointer"
	>
		Edit
	</button>
</div>
