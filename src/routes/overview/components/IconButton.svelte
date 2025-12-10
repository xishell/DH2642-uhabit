<script lang="ts">
	let {
		onClick,
		aria = '',
		children
	}: {
		onClick: () => void;
		aria?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<button class="p-2 rounded-md hover:bg-surface-100" onclick={onClick} aria-label={aria}>
	{@render children()}
</button>
