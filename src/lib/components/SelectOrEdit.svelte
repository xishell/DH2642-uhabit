<script lang="ts">
	let {
		unit = $bindable(''),
		required = false
	}: {
		unit?: string | null;
		required?: boolean;
	} = $props();

	const suggestions = ['times', 'min', 'ml', 'hours', 'km', 'steps', 'pages', 'glasses'];

	let inputEl = $state<HTMLInputElement>();
	let showOptions = $state(false);

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
		class="border border-surface-300-600 w-28 h-11 rounded-md text-base px-3 pr-8 bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		name="unit"
		bind:value={unit}
		bind:this={inputEl}
		placeholder="Unit"
		autocomplete="off"
		{required}
		onfocus={handleFocus}
		onblur={handleBlur}
	/>
	<span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▾</span>

	{#if showOptions}
		<ul
			class="absolute z-10 top-full left-0 mt-1 w-full bg-surface-50 dark:bg-surface-900 border border-surface-300-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
		>
			{#each suggestions as suggestion}
				<li>
					<button
						type="button"
						class="w-full text-left px-3 py-2.5 text-base hover:bg-surface-200-700 active:bg-surface-300-600"
						onmousedown={(e) => {
							e.preventDefault();
							selectOption(suggestion);
						}}
					>
						{suggestion}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
