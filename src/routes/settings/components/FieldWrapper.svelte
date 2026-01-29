<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';

	interface Props {
		field: string;
		label: string;
		children: import('svelte').Snippet;
	}

	let { field, label, children }: Props = $props();

	// Get changedFields from context (provided by settings page)
	const changedFields = getContext<Readable<Set<string>>>('settingsChangedFields');

	const isChanged = $derived(changedFields ? $changedFields.has(field) : false);
</script>

<div class="relative">
	<div class="flex items-center gap-2 mb-1">
		<label for={field} class="label text-sm font-medium">{label}</label>
		{#if isChanged}
			<span
				class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300"
			>
				Modified
			</span>
		{/if}
	</div>
	<div class:ring-2={isChanged} class:ring-warning-500={isChanged} class="rounded-lg">
		{@render children()}
	</div>
</div>
