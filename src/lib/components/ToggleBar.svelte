<script lang="ts">
	// 0 = Progressive, 1 = Single-Step (keeps old numeric contract)
	let {
		habitType = 1,
		onChange
	}: {
		habitType?: 0 | 1;
		onChange: (val: 0 | 1) => void;
	} = $props();

	function activateP() {
		onChange?.(0);
	}

	function activateS() {
		onChange?.(1);
	}
</script>

<div
	class="text-sm p-[5px] rounded-full border border-surface-700 inline-flex gap-2 bg-surface-800"
	role="tablist"
	aria-label="Select habit type"
>
	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={habitType === 0}
		class:text-white={habitType === 0}
		class:text-surface-300={habitType !== 0}
		onclick={activateP}
		aria-pressed={habitType === 0}
	>
		Progressive
	</button>

	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={habitType === 1}
		class:text-white={habitType === 1}
		class:text-surface-300={habitType !== 1}
		onclick={activateS}
		aria-pressed={habitType === 1}
	>
		Single-Step
	</button>
</div>
