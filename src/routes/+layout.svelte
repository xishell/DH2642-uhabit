<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { themeMode } from '$lib/stores/theme';
	import { avatarUrl } from '$lib/stores/avatar';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster';

	export let data: {
		user: {
			id: string;
			name?: string | null;
			username?: string | null;
			displayName?: string | null;
			email?: string | null;
			image?: string | null;
		} | null;
	};

	$: if (data.user?.image !== undefined) {
		avatarUrl.set(data.user.image ?? null);
	}

	onMount(() => {
		themeMode.initialize();

		// Register service worker for push notifications (authenticated users only)
		if ('serviceWorker' in navigator && data.user) {
			navigator.serviceWorker.register('/sw.js').catch((err) => {
				console.warn('Service worker registration failed:', err);
			});
		}
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
