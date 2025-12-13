<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let {
		open,
		onToggle,
		onCreateHabit,
		onCreateGoal
	}: {
		open: boolean;
		onToggle: () => void;
		onCreateHabit: () => void;
		onCreateGoal: () => void;
	} = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black/30 z-40"
		transition:fade={{ duration: 200 }}
		onclick={onToggle}
		onkeydown={(e) => e.key === 'Enter' && onToggle()}
		role="button"
		tabindex="-1"
	></div>
{/if}

<div class="fixed bottom-10 right-10 flex flex-col items-end gap-3 z-50">
	{#if open}
		<div class="flex flex-col gap-2" transition:fade={{ duration: 150 }}>
			<button
				class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-400 transition-colors text-sm"
				onclick={onCreateHabit}
			>
				Create Task
			</button>
			<button
				class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-400 transition-colors text-sm"
				onclick={onCreateGoal}
			>
				Create Goal
			</button>
		</div>
	{/if}

	<button
		class="w-16 h-16 bg-primary-500 rounded-full shadow-xl hover:bg-primary-400 transition-all duration-200 flex items-center justify-center text-white"
		onclick={onToggle}
	>
		<Plus
			size={26}
			strokeWidth={3}
			class="transition-transform duration-200 {open ? 'rotate-45' : ''}"
		/>
	</button>
</div>
