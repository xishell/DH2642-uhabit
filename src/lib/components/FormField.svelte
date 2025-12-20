<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		id,
		label,
		required = false,
		error = '',
		children
	}: {
		id: string;
		label: string;
		required?: boolean;
		error?: string | null;
		children: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-1">
	<label for={id} class="text-sm font-medium"
		>{label}{#if required}
			<span class="text-error-500">*</span>{/if}</label
	>
	{@render children()}
	{#if error}
		<p id="{id}-error" class="text-error-500 text-xs mt-1" role="alert">{error}</p>
	{/if}
</div>
