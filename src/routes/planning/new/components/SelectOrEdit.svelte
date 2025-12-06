<script lang="ts">
	import { SquarePen } from 'lucide-svelte';
	import { SquareCheckBig } from 'lucide-svelte';

	let isEditing = false;
	let customUnit: string | null = '';
	let isIndicatorVisible = true;
	export let unit: string | null = 'ml';

	$: if (!isEditing) {
		customUnit = unit;
	}
	function enableEdit() {
		customUnit = unit;
		isEditing = true;
	}

	function save() {
		if (customUnit?.trim()) {
			unit = customUnit?.trim();
		}
		isEditing = false;
		isIndicatorVisible = true;
	}
	function hideUnitIndicator() {
		isIndicatorVisible = false;
	}
</script>

<div class="flex items-center gap-1 relative">
	{#if !isEditing}
		<select
			class="border border-gray-300 w-18 h-9 rounded-md text-sm text-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
			name="unit"
			bind:value={unit}
		>
			<option value="times">times</option>
			<option value="min">min</option>
			<option value="ml">ml</option>
		</select>

		<button
			class="text-xs w-10 h-9 rounded hover:bg-gray-100 flex justify-center items-center"
			on:click={enableEdit}
		>
			<SquarePen strokeWidth={1.4} />
		</button>
	{:else}
		<input
			class="border border-gray-300 w-18 h-9 rounded-md text-sm pl-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
			name="unit"
			bind:value={customUnit}
			on:blur={save}
			on:focus={hideUnitIndicator}
			on:keydown={(e) => e.key === 'Enter' && save()}
			autofocus
		/>

		<button class="text-xs w-10 h-9 rounded hover:bg-gray-100 flex justify-center items-center">
			<SquareCheckBig strokeWidth={1.4} /></button
		>
	{/if}
	<p class="unit-indicator text-sm absolute pl-2" class:text-transparent={!isIndicatorVisible}>
		{unit}
	</p>
</div>
