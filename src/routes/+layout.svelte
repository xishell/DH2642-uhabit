<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
</script>

<svelte:head>
	<title>uhabit - Build Better Habits</title>
	<meta
		name="description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>

	<!-- Open Graph / Facebook / Discord / LinkedIn -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="uhabit - Build Better Habits" />
	<meta
		property="og:description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>
	<meta property="og:image" content="/og-image.png" />
	<meta property="og:site_name" content="uhabit" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="uhabit - Build Better Habits" />
	<meta
		name="twitter:description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>
	<meta name="twitter:image" content="/og-image.png" />

	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Outer wrapper controlling full page -->
<div class="min-h-screen midnight bg-surface-900 text-surface-50 flex flex-col">
	<Header />

	<!-- Main content slot -->
	<main class="flex-1">
		<slot />
	</main>
</div>
