<script lang="ts">
	export let data: number[] = [];

	const colors = [
		'bg-primary-700', // Less
		'bg-primary-600',
		'bg-primary-500',
		'bg-primary-400',
		'bg-primary-300' // More
	];

	function getColor(value: number) {
		if (value == null || value === 0) return colors[0];
		if (value === 1) return colors[1];
		if (value === 2) return colors[2];
		if (value === 3) return colors[3];
		return colors[4];
	}
</script>

<div
	class="flex heatmap-card overflow-hidden shrink-0 flex-1 flex-col p-4 justify-between border border-surface-700 bg-surface-800 rounded-xl"
>
	<h3 class="text-white font-semibold">Consistency heatmap</h3>

	<div class="grid grid-cols-12 gap-1 mt-2">
		{#each data as value}
			<div class={`flex-1 h-4 rounded ${getColor(value)}`}></div>
		{/each}
	</div>
	<div class="flex self-center gap-1 mt-2">
		<span class="text-xs text-surface-400">Less</span>
		{#each [0, 1, 2, 3, 4] as value}
			<div class={`w-4 h-4 rounded ${getColor(value)}`}></div>
		{/each}
		<span class="text-xs text-surface-400">More</span>
	</div>
	<span class="text-surface-400 text-xs mt-2">Streaks:12 / Best: 19</span>
</div>
