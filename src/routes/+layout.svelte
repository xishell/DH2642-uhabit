<script lang="ts">
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { themeMode } from '$lib/stores/theme';
	import { reduceMotion } from '$lib/stores/reduceMotion';
	import { avatarUrl } from '$lib/stores/avatar';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster';

	// Page order for directional transitions
	const pageOrder: Record<string, number> = {
		'/overview': 0,
		'/habits': 1,
		'/statistics': 2,
		'/settings': 3
	};

	function getPageIndex(path: string): number {
		// Check exact match first, then prefix match
		if (pageOrder[path] !== undefined) return pageOrder[path];
		for (const [route, index] of Object.entries(pageOrder)) {
			if (path.startsWith(route)) return index;
		}
		return -1;
	}

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		const fromPath = navigation.from?.url.pathname ?? '/';
		const toPath = navigation.to?.url.pathname ?? '/';

		if (fromPath === toPath) return;

		const fromIndex = getPageIndex(fromPath);
		const toIndex = getPageIndex(toPath);

		const direction = toIndex >= fromIndex ? 'forward' : 'back';
		document.documentElement.dataset.navDirection = direction;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	export let data: {
		user: {
			id: string;
			name?: string | null;
			username?: string | null;
			email?: string | null;
			image?: string | null;
		} | null;
	};

	$: if (data.user?.image !== undefined) {
		avatarUrl.set(data.user.image ?? null);
	}

	onMount(() => {
		themeMode.initialize();
		reduceMotion.initialize();

		// Register service worker for push notifications (authenticated users only)
		if ('serviceWorker' in navigator && data.user) {
			navigator.serviceWorker.register('/sw.js').catch((err) => {
				console.warn('Service worker registration failed:', err);
			});
		}
	});
</script>

<svelte:head>
	<title>uhabit - Build Better Habits</title>
	<meta
		name="description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>

	<!-- Open Graph / Facebook / Discord / LinkedIn -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:title" content="uhabit - Build Better Habits" />
	<meta
		property="og:description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>
	<meta property="og:image" content="{$page.url.origin}/og" />
	<meta property="og:site_name" content="uhabit" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="uhabit - Build Better Habits" />
	<meta
		name="twitter:description"
		content="Track your daily habits, build consistency, and achieve your goals with uhabit."
	/>
	<meta name="twitter:image" content="{$page.url.origin}/og" />

	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Outer wrapper controlling full page -->
<div
	class="min-h-dvh bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 flex flex-col"
>
	<Header user={data.user} />

	<!-- Main content slot -->
	<main class="flex-1">
		<slot />
	</main>
</div>

<!-- Global Toast Container -->
<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>
