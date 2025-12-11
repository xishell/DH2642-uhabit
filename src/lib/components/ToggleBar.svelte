<script lang="ts">
	// 0 = Tasks, 1 = Goals
	let {
		activeTab = 0,
		onChange
	}: {
		activeTab?: 0 | 1;
		onChange: (val: 0 | 1) => void;
	} = $props();

	function activateTasks() {
		onChange?.(0);
	}

	function activateGoals() {
		onChange?.(1);
	}
</script>

<div
	class="text-sm p-[5px] rounded-full border border-surface-700 inline-flex gap-2 bg-surface-800"
	role="tablist"
	aria-label="Select view"
>
	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={activeTab === 0}
		class:text-white={activeTab === 0}
		class:text-surface-300={activeTab !== 0}
		onclick={activateTasks}
		aria-pressed={activeTab === 0}
	>
		Tasks
	</button>

	<button
		type="button"
		class="py-1 px-3 rounded-full transition"
		class:bg-violet-600={activeTab === 1}
		class:text-white={activeTab === 1}
		class:text-surface-300={activeTab !== 1}
		onclick={activateGoals}
		aria-pressed={activeTab === 1}
	>
		Goals
	</button>
</div>
