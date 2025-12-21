<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { getPreferences, updatePreferences, getSession } from '$lib/auth/client';
	import type { UserSettingsResponse } from '$lib/auth/client';
	import { STORAGE_KEYS } from '$lib/constants';
	import { themeMode as themeStore, type ThemeMode } from '$lib/stores/theme';
	import { reduceMotion as motionStore } from '$lib/stores/reduceMotion';
	import { settingsChanges, hasUnsavedChanges } from '$lib/stores/settingsChanges';
	import { avatarUrl as avatarStore } from '$lib/stores/avatar';
	import { userCountry } from '$lib/stores/country';
	import { toaster } from '$lib/stores/toaster';
	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';
	import SaveBar from './components/SaveBar.svelte';
	import SettingsSkeleton from './components/SettingsSkeleton.svelte';
	import MobileNav from './components/MobileNav.svelte';

	// Current values (editable)
	let name = $state('');
	let bio = $state('');
	let pronouns = $state('');
	let username = $state('');
	let email = $state('');
	let currentTheme = $state<ThemeMode>('system');
	let currentReduceMotion = $state<boolean>(false);
	let country = $state('');
	let accentColor = $state('');
	let typography = $state('');

	// Avatar
	let avatarUrl = $state<string | null>(null);

	// Notification preferences
	let pushEnabled = $state(false);
	let habitReminders = $state(true);
	let streakMilestones = $state(true);
	let goalProgress = $state(true);
	let holidaySuggestions = $state(true);
	let reminderTime = $state('08:00');

	// Original values (for tracking changes)
	let originalValues = $state<Record<string, unknown>>({});

	let sessionEmail = '';
	let isMobile = $state(false);
	let isLoading = $state(true);
	let isSaving = $state(false);

	const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

	function applyProfileSettings(s: UserSettingsResponse) {
		name = s.name ?? '';
		pronouns = s.pronouns ?? '';
		username = s.username ?? '';
		avatarUrl = s.imageUrl ?? null;
		avatarStore.set(avatarUrl);
	}

	function applyPreferences(s: UserSettingsResponse) {
		currentTheme = (s.theme as ThemeMode) || 'system';
		themeStore.set(currentTheme);
		country = s.country ?? '';
		userCountry.set(s.country ?? null);
		bio = s.preferences?.bio ?? '';
		accentColor = s.preferences?.accentColor ?? '';
		typography = s.preferences?.typography ?? '';
	}

	function initializeLocalPreferences() {
		// Subscribe once to get initial value
		const unsubscribe = motionStore.subscribe((value) => {
			currentReduceMotion = value;
		});
		unsubscribe();
	}

	function applyNotificationPrefs(notifPrefs: UserSettingsResponse['preferences']) {
		const n = notifPrefs?.notificationPrefs;
		pushEnabled = n?.pushEnabled ?? false;
		habitReminders = n?.habitReminders ?? true;
		streakMilestones = n?.streakMilestones ?? true;
		goalProgress = n?.goalProgress ?? true;
		holidaySuggestions = n?.holidaySuggestions ?? true;
		reminderTime = n?.reminderTime ?? '08:00';
	}

	function captureOriginalValues() {
		originalValues = {
			name,
			bio,
			pronouns,
			username,
			email,
			theme: currentTheme,
			reduceMotion: currentReduceMotion,
			country,
			accentColor,
			typography,
			pushEnabled,
			habitReminders,
			streakMilestones,
			goalProgress,
			holidaySuggestions,
			reminderTime
		};
		settingsChanges.clearAll();
	}

	const applySettings = (settings: UserSettingsResponse, setAsOriginal = false) => {
		applyProfileSettings(settings);
		applyPreferences(settings);
		applyNotificationPrefs(settings.preferences);
		initializeLocalPreferences();
		if (setAsOriginal) captureOriginalValues();
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
				name: name || undefined,
				pronouns: pronouns || undefined,
				username: username || undefined,
				theme: currentTheme,
				country: country || undefined,
				preferences: {
					bio,
					accentColor,
					typography,
					notificationPrefs: {
						pushEnabled,
						habitReminders,
						streakMilestones,
						goalProgress,
						holidaySuggestions,
						reminderTime
					}
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

	// Handle avatar change (immediate, not part of save/discard flow)
	function handleAvatarChange(newUrl: string | null) {
		avatarUrl = newUrl;
	}

	// Field setters for discarding changes
	const fieldSetters: Record<string, (v: unknown) => void> = {
		name: (v) => (name = v as string),
		bio: (v) => (bio = v as string),
		pronouns: (v) => (pronouns = v as string),
		username: (v) => (username = v as string),
		theme: (v) => {
			currentTheme = v as ThemeMode;
			themeStore.set(currentTheme);
		},
		reduceMotion: (v) => {
			currentReduceMotion = v as boolean;
			motionStore.set(currentReduceMotion);
		},
		country: (v) => {
			country = v as string;
			userCountry.set(country || null);
		},
		accentColor: (v) => (accentColor = v as string),
		typography: (v) => (typography = v as string),
		pushEnabled: (v) => (pushEnabled = v as boolean),
		habitReminders: (v) => (habitReminders = v as boolean),
		streakMilestones: (v) => (streakMilestones = v as boolean),
		goalProgress: (v) => (goalProgress = v as boolean),
		holidaySuggestions: (v) => (holidaySuggestions = v as boolean),
		reminderTime: (v) => (reminderTime = v as string)
	};

	// Discard all changes
	function handleDiscardAll() {
		settingsChanges.getOriginalValues().forEach((value, field) => fieldSetters[field]?.(value));
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
	<main class="flex-1 p-6 max-w-4xl space-y-16" class:pb-40={isMobile}>
		{#if isLoading}
			<SettingsSkeleton />
		{:else}
			<section id="profile" class="scroll-mt-20">
				<PublicProfile
					{name}
					{bio}
					{pronouns}
					imageUrl={avatarUrl}
					onAvatarChange={handleAvatarChange}
					onFieldChange={(field, value) => fieldSetters[field]?.(value)}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="account" class="scroll-mt-20">
				<Account
					{username}
					{email}
					onFieldChange={(field, value) => fieldSetters[field]?.(value)}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="preferences" class="scroll-mt-20">
				<Preferences
					{currentTheme}
					reduceMotion={currentReduceMotion}
					{country}
					{accentColor}
					{typography}
					onFieldChange={(field, value) => fieldSetters[field]?.(value)}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="notifications" class="scroll-mt-20">
				<Notifications
					{pushEnabled}
					{habitReminders}
					{streakMilestones}
					{goalProgress}
					{holidaySuggestions}
					{reminderTime}
					onFieldChange={(field, value) => fieldSetters[field]?.(value)}
				/>
			</section>
		{/if}
	</main>

	{#if isMobile}
		<MobileNav />
	{/if}

	<!-- FLOATING SAVE BAR -->
	<SaveBar onSave={handleSaveAll} onDiscard={handleDiscardAll} {isSaving} {isMobile} />
</div>
