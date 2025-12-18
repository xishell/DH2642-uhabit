<script lang="ts">
	import TabNav from './components/TabNav.svelte';
	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';

	import { Toast, createToaster, Tabs } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';

	// Tabs value
	let value = 'profile';

	// Toaster instance (used in parent)
	const toaster = createToaster();

	// ---- Example app state (replace with API-loaded data) ----
	let displayName = 'John Doe';
	let bio = 'Tell the world about yourself';
	let pronouns = 'they/them';

	let username = 'johndoe';
	let firstName = 'John';
	let lastName = 'Doe';
	let email = 'john@example.com';

	let themeMode: 'light' | 'dark' = 'light';
	let accentColor = 'indigo';
	let typography = 'sans';

	let desktopNotifications = true;

	onMount(() => {
		// TODO: load real data from API and set the states above
	});

	// ---- Callback handlers for child components ----
	function handleSavePublicProfile(payload: {
		displayName: string;
		bio: string;
		pronouns: string;
	}) {
		displayName = payload.displayName;
		bio = payload.bio;
		pronouns = payload.pronouns;

		toaster.success({
			title: 'Profile saved',
			description: 'Your public profile has been updated.'
		});
	}

	function handleSaveAccount(payload: { field: 'username' | 'firstName' | 'lastName' | 'email' }) {
		toaster.info({
			title: 'Account',
			description: `You clicked to change ${payload.field}.`
		});
	}

	function handleSavePreferences(payload: {
		themeMode: 'light' | 'dark';
		accentColor: string;
		typography: string;
	}) {
		themeMode = payload.themeMode;
		accentColor = payload.accentColor;
		typography = payload.typography;

		toaster.success({
			title: 'Preferences saved',
			description: 'Theme and typography updated.'
		});
	}

	function handleSaveNotifications(payload: { desktop: boolean }) {
		desktopNotifications = payload.desktop;

		toaster.success({
			title: 'Notifications',
			description: 'Notification settings updated.'
		});
	}
</script>

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900">
	<!-- Left navigation -->
	<aside class="w-72 border-r border-surface-200 dark:border-surface-700 p-6">
		<h2 class="text-2xl font-semibold mb-4">Settings</h2>
		<TabNav bind:value />
	</aside>

	<!-- Main content -->
	<main class="flex-1 p-6 max-w-5xl">
		<Tabs {value} onValueChange={(details) => (value = details.value)}>
			<Tabs.List>
				<Tabs.Trigger value="profile">Public profile</Tabs.Trigger>
				<Tabs.Trigger value="account">Account</Tabs.Trigger>
				<Tabs.Trigger value="preferences">Preferences</Tabs.Trigger>
				<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
				<Tabs.Indicator />
			</Tabs.List>

			<Tabs.Content value="profile">
				<PublicProfile {displayName} {bio} {pronouns} onSave={handleSavePublicProfile} />
			</Tabs.Content>

			<Tabs.Content value="account">
				<Account {username} {firstName} {lastName} {email} onChange={handleSaveAccount} />
			</Tabs.Content>

			<Tabs.Content value="preferences">
				<Preferences {themeMode} {accentColor} {typography} onSave={handleSavePreferences} />
			</Tabs.Content>

			<Tabs.Content value="notifications">
				<Notifications {desktopNotifications} onSave={handleSaveNotifications} />
			</Tabs.Content>
		</Tabs>

		<!-- Toasts -->
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
	</main>
</div>
