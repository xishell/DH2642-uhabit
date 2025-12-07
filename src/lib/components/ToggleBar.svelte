<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let habitType: 0 | 1;
	const dispatch = createEventDispatcher();

	const activateP = () => {
		dispatch('change', 0);
	};

	const activateS = () => {
		dispatch('change', 1);
	};
</script>

<div
	class="text-[14px] p-[5px] rounded-[40px] border border-primary-500 flex justify-between gap-2"
>
	<button
		class="py-1 px-3 rounded-[40px] hover:bg-primary-500 transition-[1s] cursor-pointer"
		class:bg-primary-500={habitType == 0}
		class:text-surface-50={habitType == 0}
		on:click={activateP}
		>Progressive
	</button>
	<button
		class="py-1 px-3 rounded-[40px] hover:bg-primary-500 transition-[1s] cursor-pointer"
		class:bg-primary-500={habitType == 1}
		class:text-surface-50={habitType == 1}
		on:click={activateS}>Single-Step</button
	>
</div>
