<script lang="ts">
	let {
		unit = $bindable(''),
		required = false,
		hasError = false,
		onblur: externalBlur,
		onfocus: externalFocus
	}: {
		unit?: string | null;
		required?: boolean;
		hasError?: boolean;
		onblur?: () => void;
		onfocus?: () => void;
	} = $props();

	const suggestions = ['times', 'min', 'ml', 'hours', 'km', 'steps', 'pages', 'glasses'];

	let inputEl = $state<HTMLInputElement>();
	let showOptions = $state(false);

	function handleFocus() {
		showOptions = true;
		externalFocus?.();
	}

	function handleBlur() {
		// Delay to allow click on option
		setTimeout(() => {
			showOptions = false;
			externalBlur?.();
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
		id="habit-unit"
		class="border w-28 h-11 rounded-md text-base px-3 pr-8 bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
		class:border-surface-400-600={!hasError}
		class:border-red-500={hasError}
		name="unit"
		bind:value={unit}
		bind:this={inputEl}
		placeholder="Unit"
		autocomplete="off"
		{required}
		aria-invalid={hasError}
		onfocus={handleFocus}
		onblur={handleBlur}
	/>
	<span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▾</span>

	{#if showOptions}
		<ul
			class="absolute z-10 top-full left-0 mt-1 w-full bg-surface-200-800 border border-surface-400-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
		>
			{#each suggestions as suggestion}
				<li>
					<button
						type="button"
						class="w-full text-left px-3 py-2.5 text-base hover:bg-surface-200-800 active:bg-surface-400-600"
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
