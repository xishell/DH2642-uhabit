<script lang="ts">
	let {
		colors,
		selectedColor,
		onSelect
	}: { colors: string[]; selectedColor: string; onSelect: (color: string) => void } = $props();
</script>

<div class="flex flex-col gap-1">
	<span class="text-sm font-medium">Color</span>
	<div class="flex gap-2 flex-wrap">
		{#each colors as color}
			<button
				type="button"
				class="relative w-9 h-9 rounded-full border-2 transition-all duration-150"
				style="background-color: {color};"
				class:border-primary-500={selectedColor === color}
				class:ring-2={selectedColor === color}
				class:ring-primary-200={selectedColor === color}
				class:border-transparent={selectedColor !== color}
				onclick={() => onSelect(color)}
				aria-label={`Select color ${color}`}
				aria-pressed={selectedColor === color}
			>
				{#if selectedColor === color}
					<span class="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white/80 dark:bg-black/70"
					></span>
				{/if}
			</button>
		{/each}
	</div>
</div>
