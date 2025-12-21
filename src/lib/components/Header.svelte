<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { routes } from '$lib/routes';
	import { signOut } from '$lib/auth/client';
	import { LogOutIcon, MenuIcon, XIcon } from '@lucide/svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { avatarUrl } from '$lib/stores/avatar';
	import NotificationBell from './NotificationBell.svelte';

	let {
		user = null
	}: {
		user?: {
			id: string;
			name?: string | null;
			username?: string | null;
			email?: string | null;
			image?: string | null;
		} | null;
	} = $props();

	const currentPath = $derived($page.url.pathname);
	const initials = $derived.by(() => {
		const source = user?.name?.trim() || user?.username?.trim() || user?.email?.trim() || '';
		if (!source) return 'U';
		const parts = source.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return source.slice(0, 2).toUpperCase();
	});

	let menuOpen = $state(false);
	let mobileMenuOpen = $state(false);
	let menuRoot = $state<HTMLDivElement | null>(null);

	onMount(() => {
		const handleClick = (event: MouseEvent) => {
			if (!menuOpen) return;
			const target = event.target as Node | null;
			if (menuRoot && target && !menuRoot.contains(target)) {
				menuOpen = false;
			}
		};

		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	});

	const navItems = [
		{ href: routes.overview, label: 'Overview' },
		{ href: routes.habits, label: 'Habits' },
		{ href: routes.statistics, label: 'Statistics' }
	];

	async function handleLogout() {
		try {
			await signOut();
			location.href = routes.login;
		} catch (e) {
			console.error('Logout failed:', e);
		}
	}

	const showNav = $derived(!(currentPath === routes.login || currentPath === routes.register));
</script>

<header
	class="w-full bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-sm sticky top-0 z-50"
>
	<div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
		<a
			href={routes.overview}
			data-sveltekit-preload-data="hover"
			class="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50 flex-shrink-0"
		>
			UHabit
		</a>

		{#if showNav}
			<nav class="hidden md:flex items-center gap-6">
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

				<span class="text-surface-300 dark:text-surface-700 select-none" aria-hidden="true">|</span>

				<NotificationBell />

				<div class="relative" style="view-transition-name: nav-avatar;" bind:this={menuRoot}>
					<button
						type="button"
						class="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
						onclick={() => (menuOpen = !menuOpen)}
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						aria-label="User menu"
					>
						<Avatar class="h-9 w-9">
							{#if $avatarUrl}
								<Avatar.Image src={$avatarUrl} alt="User avatar" />
							{/if}
							<Avatar.Fallback
								class="bg-primary-500 text-white font-bold text-sm flex items-center justify-center"
							>
								{initials}
							</Avatar.Fallback>
						</Avatar>
					</button>

					{#if menuOpen}
						<div
							class="absolute right-0 mt-2 w-44 rounded-2xl bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 shadow-lg border border-surface-200 dark:border-surface-700 z-50 p-2"
							style="view-transition-name: avatar-menu;"
							role="menu"
							transition:fly={{ y: -6, duration: 150 }}
						>
							<a
								href={routes.settings}
								data-sveltekit-preload-data="hover"
								class="block px-4 py-2 text-sm rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
								onclick={() => (menuOpen = false)}
								role="menuitem"
							>
								Settings
							</a>
							<div class="h-px bg-surface-200 dark:bg-surface-700 my-1" aria-hidden="true"></div>
							<button
								type="button"
								class="w-full flex items-center gap-2 px-4 py-2 text-sm rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
								onclick={() => {
									menuOpen = false;
									handleLogout();
								}}
								role="menuitem"
							>
								<LogOutIcon class="size-4" />
								Logout
							</button>
						</div>
					{/if}
				</div>
			</nav>

			<div class="flex md:hidden items-center gap-3">
				<NotificationBell />

				<button
					type="button"
					class="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-expanded={mobileMenuOpen}
					aria-label="Toggle menu"
				>
					{#if mobileMenuOpen}
						<XIcon class="size-5 text-surface-700 dark:text-surface-300" />
					{:else}
						<MenuIcon class="size-5 text-surface-700 dark:text-surface-300" />
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if showNav && mobileMenuOpen}
		<div
			class="md:hidden border-t border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-900"
			transition:slide={{ duration: 200 }}
		>
			<nav class="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						data-sveltekit-preload-data="hover"
						class="px-3 py-2 rounded-lg text-sm transition-all duration-200"
						class:bg-primary-100={currentPath.startsWith(item.href)}
						class:dark:bg-primary-900={currentPath.startsWith(item.href)}
						class:text-primary-600={currentPath.startsWith(item.href)}
						class:dark:text-primary-400={currentPath.startsWith(item.href)}
						class:text-surface-600={!currentPath.startsWith(item.href)}
						class:dark:text-surface-400={!currentPath.startsWith(item.href)}
						class:hover:bg-surface-200={!currentPath.startsWith(item.href)}
						class:dark:hover:bg-surface-800={!currentPath.startsWith(item.href)}
						onclick={() => (mobileMenuOpen = false)}
					>
						{item.label}
					</a>
				{/each}

				<div class="h-px bg-surface-200 dark:bg-surface-700 my-2" aria-hidden="true"></div>

				<a
					href={routes.settings}
					data-sveltekit-preload-data="hover"
					class="px-3 py-2 rounded-lg text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors flex items-center gap-3"
					onclick={() => (mobileMenuOpen = false)}
				>
					<Avatar class="h-6 w-6">
						{#if $avatarUrl}
							<Avatar.Image src={$avatarUrl} alt="User avatar" />
						{/if}
						<Avatar.Fallback
							class="bg-primary-500 text-white font-bold text-xs flex items-center justify-center"
						>
							{initials}
						</Avatar.Fallback>
					</Avatar>
					Settings
				</a>

				<button
					type="button"
					class="px-3 py-2 rounded-lg text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors flex items-center gap-3 w-full text-left"
					onclick={() => {
						mobileMenuOpen = false;
						handleLogout();
					}}
				>
					<LogOutIcon class="size-4" />
					Logout
				</button>
			</nav>
		</div>
	{/if}
</header>
