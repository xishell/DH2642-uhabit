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

<div class="inline-flex gap-6">
	<button
		class="pb-2 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2
			{habitType == 0 ? 'border-primary-500 text-surface-900-50 text-glow-sm' : 'border-transparent text-surface-400 hover:text-surface-600-300'}"
		on:click={activateP}
	>
		Progressive
	</button>
	<button
		class="pb-2 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2
			{habitType == 1 ? 'border-primary-500 text-surface-900-50 text-glow-sm' : 'border-transparent text-surface-400 hover:text-surface-600-300'}"
		on:click={activateS}
	>
		Single-Step
	</button>
</div>
