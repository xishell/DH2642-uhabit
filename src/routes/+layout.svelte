<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Pages that should NOT show the header
	const authPages = ['/login', '/register', '/'];
	let showHeader = $derived(!authPages.includes($page.url.pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-surface-50-950">
	{#if showHeader}
		<Header />
	{/if}
	<main>
		{@render children()}
	</main>
</div>
