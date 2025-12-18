<script lang="ts">
	import { Toast, createToaster } from '@skeletonlabs/skeleton-svelte';

	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';

	const toaster = createToaster();

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

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900 justify-center items-start">
	<!-- LEFT NAV -->
	<aside class="w-72 border-r border-surface-200 dark:border-surface-700 p-6 sticky top-0 h-screen">
		<h2 class="text-xl font-semibold mb-6">Settings</h2>
		<TabNav />
	</aside>

	<!-- MAIN CONTENT -->
	<main class="flex-1 p-6 max-w-4xl space-y-16">
		<section id="profile">
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
		</section>

		<hr class="border-surface-200 dark:border-surface-700" />

		<section id="account">
			<Account
				{username}
				{email}
				onSave={(payload) => {
					username = payload.username;
					email = payload.email;

					toaster.success({
						title: 'Account updated',
						description: 'Your account details were updated.'
					});
				}}
			/>
		</section>

		<hr class="border-surface-200 dark:border-surface-700" />

		<section id="preferences">
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
		</section>

		<hr class="border-surface-200 dark:border-surface-700" />

		<section id="notifications">
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
		</section>
	</main>

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
