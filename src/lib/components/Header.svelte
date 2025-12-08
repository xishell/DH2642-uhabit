<script lang="ts">
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';
	import { onMount } from 'svelte';

	$: currentPath = $page.url.pathname;

	const navItems = [
		{ href: routes.overview, label: 'Overview' },
		{ href: routes.habits.list, label: 'Habits' }
	];

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			// navigate to login - keep it simple and reliable
			location.href = routes.login;
		} catch (err) {
			console.error('Logout failed:', err);
		}
	}
</script>

<header class="w-full border-b border-surface-200 shadow-sm bg-white">
	<div class="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
		<a href={routes.overview} class="text-lg font-semibold tracking-tight">
			UHabit
		</a>

		<nav class="flex items-center gap-6">
			{#each navItems as item}
				<a
					href={item.href}
					class="text-sm transition-all duration-200"
					class:text-surface-900={currentPath.startsWith(item.href)}
					class:text-surface-500={!currentPath.startsWith(item.href)}
				>
					{item.label}
				</a>
			{/each}

			<button
				type="button"
				on:click={handleLogout}
				class="text-sm text-surface-500 hover:text-surface-900 transition-colors duration-200"
			>
				Logout
			</button>
		</nav>
	</div>
</header>
