<script lang="ts">
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';

	$: currentPath = $page.url.pathname;

	const navItems = [
		{ href: routes.overview, label: 'Overview' },
		{ href: routes.habits.list, label: 'Habits' }
	];

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			window.location.href = routes.login;
		} catch (err) {
			console.error('Logout failed:', err);
		}
	}
</script>

<header class="w-full border-b border-surface-200-800 shadow-sm">
	<div class="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
		<a href={routes.overview} class="text-lg font-semibold tracking-tight">
			UHabit
		</a>

		<nav class="flex items-center gap-6">
			{#each navItems as item}
				<a
					href={item.href}
					class="text-sm transition-all duration-200
						{currentPath.startsWith(item.href)
							? 'text-surface-900-50 text-glow-sm'
							: 'text-surface-500 hover:text-surface-900-50'}"
				>
					{item.label}
				</a>
			{/each}

			<button
				on:click={handleLogout}
				class="text-sm text-surface-500 hover:text-surface-900-50 transition-colors duration-200"
			>
				Logout
			</button>
		</nav>
	</div>
</header>
