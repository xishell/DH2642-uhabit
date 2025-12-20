<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Toast, createToaster, Collapsible } from '@skeletonlabs/skeleton-svelte';
	import { ArrowUpDownIcon } from '@lucide/svelte';

	import { getPreferences, updatePreferences, getSession } from '$lib/auth/client';
	import type { UserSettingsResponse } from '$lib/auth/client';
	import { STORAGE_KEYS } from '$lib/constants';
	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';

	const toaster = createToaster();

	let displayName = '';
	let bio = '';
	let pronouns = '';

	let username = '';
	let email = '';

	let themeMode: 'light' | 'dark' = 'light';
	let accentColor = '';
	let typography = '';

	let desktopNotifications = false;

	let sessionEmail = '';
	let isMobile = false;
	let isLoading = true;

	const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

	const applySettings = (settings: UserSettingsResponse) => {
		displayName = settings.displayName ?? '';
		pronouns = settings.pronouns ?? '';
		username = settings.username ?? '';
		themeMode = settings.theme === 'dark' ? 'dark' : 'light';

		bio = settings.preferences?.bio ?? '';
		accentColor = settings.preferences?.accentColor ?? '';
		typography = settings.preferences?.typography ?? '';
		desktopNotifications = settings.preferences?.notifications ?? false;
	};

	const readSettingsCache = () => {
		if (!browser) return null;
		const raw = sessionStorage.getItem(STORAGE_KEYS.SETTINGS_CACHE);
		if (!raw) return null;
		try {
			const cached = JSON.parse(raw) as { savedAt: number; data: UserSettingsResponse };
			if (Date.now() - cached.savedAt > SETTINGS_CACHE_TTL_MS) return null;
			return cached.data;
		} catch {
			return null;
		}
	};

	const writeSettingsCache = (settings: UserSettingsResponse) => {
		if (!browser) return;
		sessionStorage.setItem(
			STORAGE_KEYS.SETTINGS_CACHE,
			JSON.stringify({ savedAt: Date.now(), data: settings })
		);
	};

	if (browser) {
		const cached = readSettingsCache();
		if (cached) {
			applySettings(cached);
			isLoading = false;
		}
	}

	onMount(() => {
		const update = () => (isMobile = window.innerWidth < 768);
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});

	onMount(async () => {
		try {
			const cached = readSettingsCache();
			if (cached) {
				applySettings(cached);
				isLoading = false;
			}

			const [session, settings] = await Promise.all([getSession(), getPreferences()]);
			sessionEmail = session?.user?.email ?? '';
			if (sessionEmail) {
				email = sessionEmail;
			}

			applySettings(settings);
			writeSettingsCache(settings);
		} catch (error) {
			toaster.error({
				title: 'Settings error',
				description: error instanceof Error ? error.message : 'Failed to load settings.'
			});
		} finally {
			isLoading = false;
		}
	});

	function go(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900 justify-center items-start">
	<!-- LEFT NAV (DESKTOP ONLY – UNCHANGED) -->
	{#if !isMobile}
		<aside
			class="w-72 border-r border-surface-200 dark:border-surface-700 p-6 sticky top-0 h-screen"
		>
			<h2 class="text-xl font-semibold mb-6">Settings</h2>
			<TabNav />
		</aside>
	{/if}

	<!-- MAIN CONTENT -->
	<main class="flex-1 p-6 max-w-4xl space-y-16" class:pb-24={isMobile}>
		{#if isLoading}
			<div class="space-y-12 animate-pulse">
				<section class="space-y-6">
					<div class="h-6 w-40 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="card p-6 space-y-4">
							<div class="h-4 w-28 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
							<div class="h-4 w-20 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-24 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
							<div class="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
							<div class="h-10 w-28 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						</div>
						<div class="card p-6 space-y-4">
							<div class="h-32 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
							<div class="h-5 w-1/2 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-4 w-full bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-4 w-2/3 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						</div>
					</div>
				</section>

				<section class="space-y-6">
					<div class="h-6 w-28 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
					<div class="card p-6 space-y-4">
						<div class="flex items-center justify-between">
							<div class="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						</div>
						<div class="flex items-center justify-between">
							<div class="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
							<div class="h-8 w-16 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						</div>
					</div>
				</section>

				<section class="space-y-6">
					<div class="h-6 w-32 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
					<div class="card p-6 space-y-4">
						<div class="h-4 w-40 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						<div class="h-4 w-32 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						<div class="h-4 w-24 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-full bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
						<div class="h-10 w-28 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
					</div>
				</section>

				<section class="space-y-6">
					<div class="h-6 w-36 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
					<div class="card p-6 space-y-4">
						<div class="h-6 w-3/4 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
						<div class="h-10 w-28 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
					</div>
				</section>
			</div>
		{:else}
			<section id="profile">
				<PublicProfile
					{displayName}
					{bio}
					{pronouns}
					onSave={async (payload) => {
						try {
							const updated = await updatePreferences({
								displayName: payload.displayName,
								pronouns: payload.pronouns,
								preferences: { bio: payload.bio }
							});

							applySettings(updated);
							writeSettingsCache(updated);

							toaster.success({
								title: 'Profile saved',
								description: 'Your public profile has been updated.'
							});
						} catch (error) {
							toaster.error({
								title: 'Profile error',
								description: error instanceof Error ? error.message : 'Failed to save profile.'
							});
						}
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="account">
				<Account
					{username}
					{email}
					onSave={async (payload) => {
						try {
							const updated = await updatePreferences({ username: payload.username });
							applySettings(updated);
							writeSettingsCache(updated);

							if (payload.email !== email) {
								toaster.info({
									title: 'Email unchanged',
									description: 'Email updates are not available yet.'
								});
								email = sessionEmail || email;
							}

							toaster.success({
								title: 'Account updated',
								description: 'Your account details were updated.'
							});
						} catch (error) {
							toaster.error({
								title: 'Account error',
								description: error instanceof Error ? error.message : 'Failed to update account.'
							});
						}
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="preferences">
				<Preferences
					{themeMode}
					{accentColor}
					{typography}
					onSave={async (payload) => {
						try {
							const updated = await updatePreferences({
								theme: payload.themeMode,
								preferences: {
									accentColor: payload.accentColor,
									typography: payload.typography
								}
							});

							applySettings(updated);
							writeSettingsCache(updated);

							toaster.success({
								title: 'Preferences saved',
								description: 'Your preferences have been updated.'
							});
						} catch (error) {
							toaster.error({
								title: 'Preferences error',
								description: error instanceof Error ? error.message : 'Failed to save preferences.'
							});
						}
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="notifications">
				<Notifications
					{desktopNotifications}
					onSave={async (payload) => {
						try {
							const updated = await updatePreferences({
								preferences: { notifications: payload.desktop }
							});
							applySettings(updated);
							writeSettingsCache(updated);

							toaster.success({
								title: 'Notifications updated',
								description: 'Notification settings saved.'
							});
						} catch (error) {
							toaster.error({
								title: 'Notifications error',
								description:
									error instanceof Error ? error.message : 'Failed to update notifications.'
							});
						}
					}}
				/>
			</section>
		{/if}
	</main>

	<!-- MOBILE FLOATING NAV -->
	{#if isMobile}
		<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
			<Collapsible class="card preset-filled-surface-100-900 px-4 py-3 w-64 shadow-xl">
				<div class="flex justify-between items-center">
					<p class="font-semibold text-sm">Settings</p>

					<Collapsible.Trigger class="btn-icon hover:preset-tonal scale-90">
						<ArrowUpDownIcon class="size-4" />
					</Collapsible.Trigger>
				</div>

				<Collapsible.Content class="mt-3 flex flex-col gap-2">
					<button class="anchor text-left text-sm" on:click={() => go('profile')}>
						Public profile
					</button>
					<button class="anchor text-left text-sm" on:click={() => go('account')}> Account </button>
					<button class="anchor text-left text-sm" on:click={() => go('preferences')}>
						Preferences
					</button>
					<button class="anchor text-left text-sm" on:click={() => go('notifications')}>
						Notifications
					</button>
				</Collapsible.Content>
			</Collapsible>
		</div>
	{/if}

	<!-- TOASTS -->
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
</div>
