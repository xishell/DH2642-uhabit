<script lang="ts">
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';

	let {
		user = null
	}: {
		user?: { id: string; name: string } | null;
	} = $props();

	const currentPath = $derived($page.url.pathname);

	const navItems = [
		{ href: routes.overview, label: 'Overview' },
		{ href: routes.habits.list, label: 'Habits' }
	];

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			location.href = routes.login;
		} catch (e) {
			console.error('Logout failed:', e);
		}
	}

	// Only hide nav on login/register pages, but allow nav if user exists
	const showNav = $derived(!(currentPath === routes.login || currentPath === routes.register));
</script>

<header
	class="w-full bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-sm"
>
	<div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
		<!-- UHabit title left -->
		<a
			href={routes.overview}
			data-sveltekit-preload-data="hover"
			class="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50 flex-shrink-0"
		>
			UHabit
		</a>

		<!-- Nav items right -->
		{#if showNav}
			<nav class="flex items-center gap-6">
				{#each navItems as item}
					<a
						href={item.href}
						data-sveltekit-preload-data="hover"
						class="text-sm transition-all duration-200"
						class:text-primary-400={currentPath.startsWith(item.href)}
						class:text-surface-400={!currentPath.startsWith(item.href)}
					>
						{item.label}
					</a>
				{/each}

				{#if user}
					<button
						type="button"
						onclick={handleLogout}
						class="text-sm text-surface-400 hover:text-primary-400 transition-colors duration-200"
					>
						Logout
					</button>
				{/if}
			</nav>
		{/if}
	</div>
</header>
