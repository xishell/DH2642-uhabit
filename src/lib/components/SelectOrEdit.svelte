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

<div class="relative">
	<input
		class="border border-gray-300 w-28 h-11 rounded-md text-base px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400"
		name="unit"
		bind:value={unit}
		bind:this={inputEl}
		placeholder="Unit"
		autocomplete="off"
		{required}
		on:focus={handleFocus}
		on:blur={handleBlur}
	/>
	<span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>

	{#if showOptions}
		<ul class="absolute z-10 top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
			{#each suggestions as suggestion}
				<li>
					<button
						type="button"
						class="w-full text-left px-3 py-2.5 text-base text-gray-900 hover:bg-blue-50 active:bg-blue-100"
						on:mousedown|preventDefault={() => selectOption(suggestion)}
					>
						{suggestion}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
