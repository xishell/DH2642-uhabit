<script lang="ts">
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';

	export let user: { id: string; name: string } | null = null;

	$: currentPath = $page.url.pathname;

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

	// Show nav and logout only if user exists and not on login/register
	$: showNav = user && !(currentPath === routes.login || currentPath === routes.register);
</script>

<header class="w-full bg-surface-900 border-b border-surface-700 shadow-sm">
	<div class="flex items-center justify-between h-12">
		<!-- UHabit title flush left -->
		<a href={routes.overview} class="text-lg font-semibold tracking-tight text-surface-50 ml-3">
			UHabit
		</a>

	<!-- Nav items + logout flush right -->
	{#if showNav}
		<nav class="flex items-center gap-4 mr-3">
			{#each navItems as item}
				<a
					href={item.href}
					class="text-sm transition-all duration-200"
					class:text-primary-400={currentPath.startsWith(item.href)}
					class:text-surface-400={!currentPath.startsWith(item.href)}
				>
					{item.label}
				</a>
			{/each}

			<button
				type="button"
				on:click={handleLogout}
				class="text-sm text-surface-400 hover:text-primary-400 transition-colors duration-200"
			>
				Logout
			</button>
		</nav>
	{/if}
</div>

</header>
