<script lang="ts">
	export let onClick: () => void;
	export let aria = '';
</script>

<button class="p-2 rounded-md hover:bg-surface-100" on:click={onClick} aria-label={aria}>
	<slot />
</button>
