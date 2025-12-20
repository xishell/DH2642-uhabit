<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { Toast, createToaster, Collapsible } from '@skeletonlabs/skeleton-svelte';
	import { ArrowUpDownIcon } from '@lucide/svelte';

	import { getPreferences, updatePreferences, getSession } from '$lib/auth/client';
	import type { UserSettingsResponse } from '$lib/auth/client';
	import { STORAGE_KEYS } from '$lib/constants';
	import { themeMode as themeStore, type ThemeMode } from '$lib/stores/theme';
	import { settingsChanges, hasUnsavedChanges } from '$lib/stores/settingsChanges';
	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';
	import SaveBar from './components/SaveBar.svelte';

	const toaster = createToaster();

	// Current values (editable)
	let displayName = $state('');
	let bio = $state('');
	let pronouns = $state('');
	let username = $state('');
	let email = $state('');
	let currentTheme = $state<ThemeMode>('system');
	let accentColor = $state('');
	let typography = $state('');
	let desktopNotifications = $state(false);

	// Original values (for tracking changes)
	let originalValues = $state<Record<string, unknown>>({});

	let sessionEmail = '';
	let isMobile = $state(false);
	let isLoading = $state(true);
	let isSaving = $state(false);

	const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

	const applySettings = (settings: UserSettingsResponse, setAsOriginal = false) => {
		displayName = settings.displayName ?? '';
		pronouns = settings.pronouns ?? '';
		username = settings.username ?? '';
		currentTheme = (settings.theme as ThemeMode) || 'system';
		themeStore.set(currentTheme);

		bio = settings.preferences?.bio ?? '';
		accentColor = settings.preferences?.accentColor ?? '';
		typography = settings.preferences?.typography ?? '';
		desktopNotifications = settings.preferences?.notifications ?? false;

		if (setAsOriginal) {
			originalValues = {
				displayName,
				bio,
				pronouns,
				username,
				email,
				theme: currentTheme,
				accentColor,
				typography,
				notifications: desktopNotifications
			};
			settingsChanges.clearAll();
		}
	};

	// Track field changes
	function trackChange(field: string, value: unknown) {
		const original = originalValues[field];
		settingsChanges.setField(field as any, original, value);
	}

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
			applySettings(cached, true);
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
				applySettings(cached, true);
				isLoading = false;
			}

			const [session, settings] = await Promise.all([getSession(), getPreferences()]);
			sessionEmail = session?.user?.email ?? '';
			if (sessionEmail) {
				email = sessionEmail;
			}

			applySettings(settings, true);
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

	// Warn before navigation if there are unsaved changes
	beforeNavigate(({ cancel }) => {
		if ($hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				cancel();
			}
		}
	});

	// Warn before closing tab/window
	$effect(() => {
		if (!browser) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if ($hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	// Unified save handler
	async function handleSaveAll() {
		isSaving = true;
		try {
			const updated = await updatePreferences({
				displayName,
				pronouns,
				username,
				theme: currentTheme,
				preferences: {
					bio,
					accentColor,
					typography,
					notifications: desktopNotifications
				}
			});

			applySettings(updated, true);
			writeSettingsCache(updated);

			toaster.success({
				title: 'Settings saved',
				description: 'All your changes have been saved.'
			});
		} catch (error) {
			toaster.error({
				title: 'Save failed',
				description: error instanceof Error ? error.message : 'Failed to save settings.'
			});
		} finally {
			isSaving = false;
		}
	}

	// Discard all changes
	function handleDiscardAll() {
		const originals = settingsChanges.getOriginalValues();
		originals.forEach((value, field) => {
			switch (field) {
				case 'displayName':
					displayName = value as string;
					break;
				case 'bio':
					bio = value as string;
					break;
				case 'pronouns':
					pronouns = value as string;
					break;
				case 'username':
					username = value as string;
					break;
				case 'theme':
					currentTheme = value as ThemeMode;
					themeStore.set(currentTheme);
					break;
				case 'accentColor':
					accentColor = value as string;
					break;
				case 'typography':
					typography = value as string;
					break;
				case 'notifications':
					desktopNotifications = value as boolean;
					break;
			}
		});
		settingsChanges.clearAll();
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
					onFieldChange={(field, value) => {
						if (field === 'displayName') displayName = value as string;
						else if (field === 'bio') bio = value as string;
						else if (field === 'pronouns') pronouns = value as string;
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="account">
				<Account
					{username}
					{email}
					onFieldChange={(field, value) => {
						if (field === 'username') username = value as string;
						else if (field === 'email') email = value as string;
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="preferences">
				<Preferences
					{currentTheme}
					{accentColor}
					{typography}
					onFieldChange={(field, value) => {
						if (field === 'theme') currentTheme = value as ThemeMode;
						else if (field === 'accentColor') accentColor = value as string;
						else if (field === 'typography') typography = value as string;
					}}
				/>
			</section>

			<hr class="border-surface-200 dark:border-surface-700" />

			<section id="notifications">
				<Notifications
					{desktopNotifications}
					onFieldChange={(field, value) => {
						if (field === 'notifications') desktopNotifications = value as boolean;
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
					<button class="anchor text-left text-sm" onclick={() => go('profile')}>
						Public profile
					</button>
					<button class="anchor text-left text-sm" onclick={() => go('account')}> Account </button>
					<button class="anchor text-left text-sm" onclick={() => go('preferences')}>
						Preferences
					</button>
					<button class="anchor text-left text-sm" onclick={() => go('notifications')}>
						Notifications
					</button>
				</Collapsible.Content>
			</Collapsible>
		</div>
	{/if}

	<!-- FLOATING SAVE BAR -->
	<SaveBar onSave={handleSaveAll} onDiscard={handleDiscardAll} {isSaving} />

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
