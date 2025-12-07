<script lang="ts">
	import { goto } from '$app/navigation';
	import { routes } from '$lib/routes';
	export let title: string = 'Drink Water';
	export let habitId: string = '';
	export let type: string = '';
</script>

<button
	on:click={() => goto(routes.habits.edit(habitId, type))}
	class="w-full py-4 px-5 text-left border-b border-surface-200-800 hover:bg-surface-100-900 hover:glow-primary-sm hover:shadow-md transition-all duration-150 cursor-pointer flex justify-between items-center group"
>
	<span class="text-surface-900-50">{title}</span>
	<span class="text-xs text-surface-400 group-hover:text-surface-600-300 transition-colors">Edit</span>
</button>
