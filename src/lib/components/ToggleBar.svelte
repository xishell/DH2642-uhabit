<script lang="ts">
	// 0 = Progressive, 1 = Single-Step (keeps old numeric contract)
	export let habitType: 0 | 1 = 1;
	export let onChange: (val: 0 | 1) => void;

	function activateP() {
		onChange?.(0);
	}

	function activateS() {
		onChange?.(1);
	}
</script>

<div
	class="text-sm p-[5px] rounded-full border border-surface-300 inline-flex gap-2 bg-white"
	role="tablist"
	aria-label="Select habit type"
>
	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={habitType === 0}
		class:text-white={habitType === 0}
		class:text-surface-700={habitType !== 0}
		on:click={activateP}
		aria-pressed={habitType === 0}
	>
		Progressive
	</button>

	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={habitType === 1}
		class:text-white={habitType === 1}
		class:text-surface-700={habitType !== 1}
		on:click={activateS}
		aria-pressed={habitType === 1}
	>
		Single-Step
	</button>
</div>
