<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { themeMode } from '$lib/stores/theme';

	export let data: {
		user: {
			id: string;
			name?: string | null;
			username?: string | null;
			displayName?: string | null;
			email?: string | null;
		} | null;
	};

	onMount(() => {
		themeMode.initialize();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Outer wrapper controlling full page -->
<div
	class="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 flex flex-col"
>
	<Header user={data.user} />

	<!-- Main content slot -->
	<main class="flex-1">
		<slot />
	</main>
</div>
