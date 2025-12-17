<script lang="ts">
	export let data: number[] = [60, 80, 100, 100, 90, 90, 90];
</script>

<div
	class="flex flex-col justify-between period-card overflow-hidden shrink-0 flex-1 p-4 border border-surface-700 bg-surface-800 rounded-xl"
>
	<span class="text-white font-semibold">Recent momentum</span>

	<div class="flex items-end justify-between gap-1 mt-2 h-24">
		{#each data as value}
			<div
				class="bg-primary-300 rounded-full w-7 transition-all duration-300"
				style="height: {value}%;"
			></div>
		{/each}
	</div>

	<span class="text-surface-400 text-xs mt-2">Water habit, last 7 days</span>
</div>
