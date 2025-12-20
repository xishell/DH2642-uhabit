<script lang="ts">
	import { changedFields, type SettingsField } from '$lib/stores/settingsChanges';

	interface Props {
		field: SettingsField;
		label: string;
		children: import('svelte').Snippet;
	}

	let { field, label, children }: Props = $props();

	const isChanged = $derived($changedFields.has(field));
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
