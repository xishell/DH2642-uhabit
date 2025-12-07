<script lang="ts">
	export let unit: string | null = '';
	export let required: boolean = false;

	const suggestions = ['times', 'min', 'ml', 'hours', 'km', 'steps', 'pages', 'glasses'];

	let inputEl: HTMLInputElement;
	let showOptions = false;

	function handleFocus() {
		showOptions = true;
	}

	function handleBlur() {
		// Delay to allow click on option
		setTimeout(() => {
			showOptions = false;
		}, 150);
	}

	function selectOption(option: string) {
		unit = option;
		showOptions = false;
		inputEl?.blur();
	}
</script>

<div class="relative flex-1">
	<input
		class="w-full border-b border-surface-300-600 bg-transparent py-2 pr-6 text-sm focus:outline-none focus:border-surface-900-50 transition-colors"
		name="unit"
		bind:value={unit}
		bind:this={inputEl}
		placeholder="Unit"
		autocomplete="off"
		{required}
		on:focus={handleFocus}
		on:blur={handleBlur}
	/>
	<span class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400 text-xs">▾</span>

	{#if showOptions}
		<ul
			class="absolute z-10 top-full left-0 mt-2 w-full bg-surface-50-950 border border-surface-200-800 rounded-lg shadow-lg max-h-48 overflow-y-auto"
		>
			{#each suggestions as suggestion}
				<li>
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-sm text-surface-600-300 hover:bg-surface-100-900 transition-colors duration-150"
						on:mousedown|preventDefault={() => selectOption(suggestion)}
					>
						{suggestion}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
