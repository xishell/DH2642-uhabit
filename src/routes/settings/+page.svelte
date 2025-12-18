<script lang="ts">
	import { Tabs, Toast, createToaster } from '@skeletonlabs/skeleton-svelte';

	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';

	// Tabs state (controlled — Svelte 5 compatible)
	let value: 'profile' | 'account' | 'preferences' | 'notifications' = 'profile';

	// Toasts (parent-only)
	const toaster = createToaster();

	// -----------------------------
	// Mock application state
	// (replace with API data later)
	// -----------------------------
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
</script>

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900">
	<Tabs
		{value}
		orientation="vertical"
		class="flex w-full"
		onValueChange={(details) => (value = details.value as typeof value)}
	>
		<!-- LEFT SIDEBAR NAV -->
		<aside class="w-72 border-r border-surface-200 dark:border-surface-700 p-6">
			<h2 class="text-xl font-semibold mb-6">Settings</h2>

			<Tabs.List>
				<Tabs.Trigger value="profile" class="justify-start">
					Public profile
				</Tabs.Trigger>
				<Tabs.Trigger value="account" class="justify-start">
					Account
				</Tabs.Trigger>
				<Tabs.Trigger value="preferences" class="justify-start">
					Preferences
				</Tabs.Trigger>
				<Tabs.Trigger value="notifications" class="justify-start">
					Notifications
				</Tabs.Trigger>
				<Tabs.Indicator />
			</Tabs.List>
		</aside>

		<!-- MAIN CONTENT -->
		<main class="flex-1 p-6 max-w-5xl">
			<Tabs.Content value="profile">
				<PublicProfile
					{displayName}
					{bio}
					{pronouns}
					onSave={(payload) => {
						displayName = payload.displayName;
						bio = payload.bio;
						pronouns = payload.pronouns;

						toaster.success({
							title: 'Profile saved',
							description: 'Your public profile has been updated.'
						});
					}}
				/>
			</Tabs.Content>

			<Tabs.Content value="account">
				<Account
					{username}
					{firstName}
					{lastName}
					{email}
					onSave={(payload) => {
						username = payload.username;
						firstName = payload.firstName;
						lastName = payload.lastName;
						email = payload.email;

						toaster.success({
							title: 'Account updated',
							description: 'Your account details were updated.'
						});
					}}
				/>
			</Tabs.Content>

			<Tabs.Content value="preferences">
				<Preferences
					{themeMode}
					{accentColor}
					{typography}
					onSave={(payload) => {
						themeMode = payload.themeMode;
						accentColor = payload.accentColor;
						typography = payload.typography;

						toaster.success({
							title: 'Preferences saved',
							description: 'Your preferences have been updated.'
						});
					}}
				/>
			</Tabs.Content>

			<Tabs.Content value="notifications">
				<Notifications
					{desktopNotifications}
					onSave={(payload) => {
						desktopNotifications = payload.desktop;

						toaster.success({
							title: 'Notifications updated',
							description: 'Notification settings saved.'
						});
					}}
				/>
			</Tabs.Content>
		</main>
	</Tabs>

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
