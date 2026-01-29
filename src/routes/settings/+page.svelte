<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { getSession } from '$lib/auth/client';
	import { createSettingsPresenter } from '$lib/presenters/settingsPresenter';
	import { toaster } from '$lib/stores/toaster';
	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';
	import SaveBar from './components/SaveBar.svelte';
	import SettingsSkeleton from './components/SettingsSkeleton.svelte';
	import MobileNav from './components/MobileNav.svelte';

	// Create presenter
	const presenter = createSettingsPresenter({
		fetcher: fetch,
		browser,
		storage: browser ? sessionStorage : null,
		getSession
	});

	const presenterState = presenter.state;

	// Provide changedFields to child components via context
	setContext('settingsChangedFields', presenter.changedFields);

	let isMobile = $state(false);

	// Initialize from cache immediately if available
	if (browser) {
		presenter.initFromCache();
	}

	onMount(() => {
		const update = () => (isMobile = window.innerWidth < 768);
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});

	onMount(async () => {
		try {
			await presenter.loadSettings();
		} catch (error) {
			toaster.error({
				title: 'Settings error',
				description: error instanceof Error ? error.message : 'Failed to load settings.'
			});
		}
	});

	// Subscribe to hasUnsavedChanges store
	const hasUnsavedChanges = presenter.hasUnsavedChanges;

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

	// Save handler
	async function handleSaveAll() {
		const result = await presenter.saveAll();

		if (result.success) {
			toaster.success({
				title: 'Settings saved',
				description: 'All your changes have been saved.'
			});
		} else {
			toaster.error({
				title: 'Save failed',
				description: result.error || 'Failed to save settings.'
			});
		}
	}

	// Discard handler
	function handleDiscardAll() {
		presenter.discardAll();
	}

	// Avatar change handler
	async function handleAvatarUpload(file: File) {
		const result = await presenter.uploadAvatar(file);

		if (result.success) {
			toaster.success({
				title: 'Avatar updated',
				description: 'Your profile picture has been updated.'
			});
		} else {
			toaster.error({
				title: 'Upload failed',
				description: result.error || 'Could not upload avatar.'
			});
		}

		return result;
	}

	// Field change handler
	function handleFieldChange(field: string, value: unknown) {
		presenter.setField(field as Parameters<typeof presenter.setField>[0], value);
	}
</script>

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900 justify-center items-start">
	<!-- LEFT NAV (DESKTOP ONLY) -->
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
		{#if $presenterState.isLoading}
			<SettingsSkeleton />
		{:else}
			<section id="profile" class="scroll-mt-20">
				<PublicProfile
					name={$presenterState.name}
					bio={$presenterState.bio}
					pronouns={$presenterState.pronouns}
					imageUrl={$presenterState.avatarUrl}
					isUploading={$presenterState.isUploadingAvatar}
					onAvatarUpload={handleAvatarUpload}
					onFieldChange={handleFieldChange}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="account" class="scroll-mt-20">
				<Account
					username={$presenterState.username}
					email={$presenterState.email}
					onFieldChange={handleFieldChange}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="preferences" class="scroll-mt-20">
				<Preferences
					currentTheme={$presenterState.theme}
					reduceMotion={$presenterState.reduceMotion}
					country={$presenterState.country}
					accentColor={$presenterState.accentColor}
					typography={$presenterState.typography}
					onFieldChange={handleFieldChange}
				/>
			</section>
			<hr class="border-surface-200 dark:border-surface-700" />
			<section id="notifications" class="scroll-mt-20">
				<Notifications
					pushEnabled={$presenterState.pushEnabled}
					habitReminders={$presenterState.habitReminders}
					streakMilestones={$presenterState.streakMilestones}
					goalProgress={$presenterState.goalProgress}
					holidaySuggestions={$presenterState.holidaySuggestions}
					reminderTime={$presenterState.reminderTime}
					onFieldChange={handleFieldChange}
				/>
			</section>
		{/if}
	</main>

	{#if isMobile}
		<MobileNav />
	{/if}

	<!-- FLOATING SAVE BAR -->
	<SaveBar
		onSave={handleSaveAll}
		onDiscard={handleDiscardAll}
		isSaving={$presenterState.isSaving}
		{isMobile}
		hasUnsavedChanges={presenter.hasUnsavedChanges}
		changedFields={presenter.changedFields}
	/>
</div>
