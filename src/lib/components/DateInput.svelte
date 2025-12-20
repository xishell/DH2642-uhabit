<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		id,
		label,
		value = $bindable(),
		min = '',
		hasError = false,
		errorId = '',
		onblur,
		onfocus,
		error
	}: {
		id: string;
		label: string;
		value: string;
		min?: string;
		hasError?: boolean;
		errorId?: string;
		onblur?: () => void;
		onfocus?: () => void;
		error?: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-1">
	<label for={id} class="text-sm font-medium">{label} <span class="text-error-500">*</span></label>
	<input
		{id}
		type="date"
		class="border rounded-md px-3 py-2 text-sm bg-surface-200-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
		class:border-surface-400-600={!hasError}
		class:border-error-500={hasError}
		bind:value
		{min}
		{onblur}
		{onfocus}
		aria-required="true"
		aria-invalid={hasError}
		aria-describedby={hasError ? errorId : undefined}
	/>
	{#if hasError && error}{@render error()}{/if}
</div>
