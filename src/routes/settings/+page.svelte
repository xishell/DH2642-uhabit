<script lang="ts">
	// Main page wrapper. Keeps the Tabs state and toast instance.
	import TabNav from 'src/routes/settings/components/TabNav.svelte';
	import PublicProfile from 'src/routes/settings/components/PublicProfile.svelte';
	import Account from 'src/routes/settings/components/Account.svelte';
	import Preferences from 'src/routes/settings/components/Preferences.svelte';
	import Notifications from 'src/routes/settings/components/Notifications.svelte';

	import { Toast, createToaster, Tabs } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';

	// Tabs value (simple string, matches the example you provided)
	let value = 'profile';

	// Toaster (use this to show messages from main or pass to children)
	const toaster = createToaster();

	// ---- Example app state (replace these with API-loaded data) ----
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

	// Handlers triggered by children via custom events
	function handleSavePublicProfile(event: CustomEvent) {
		const { displayName: dn, bio: b, pronouns: p } = event.detail;
		// TODO: call API to save profile -> await api.saveProfile({dn, b, p})
		displayName = dn;
		bio = b;
		pronouns = p;
		toaster.success({
			title: 'Profile saved',
			description: 'Your public profile has been updated.'
		});
	}

	function handleSaveAccount(event: CustomEvent) {
		// event.detail will tell which field changed if implemented that way
		toaster.info({ title: 'Account', description: 'Account change flow initiated.' });
	}

	function handleSavePreferences(event: CustomEvent) {
		const { themeMode: tm, accentColor: ac, typography: ty } = event.detail;
		// TODO: persist preferences and apply dynamic theming
		themeMode = tm;
		accentColor = ac;
		typography = ty;
		toaster.success({ title: 'Preferences saved', description: 'Theme and typography updated.' });
	}

	function handleSaveNotifications(event: CustomEvent) {
		const { desktop } = event.detail;
		// TODO: persist notification preference
		desktopNotifications = desktop;
		toaster.success({ title: 'Notifications', description: 'Notification settings updated.' });
	}
</script>

<div class="flex min-h-screen bg-surface-50 dark:bg-surface-900">
	<!-- Left navigation column -->
	<aside class="w-72 border-r border-surface-200 dark:border-surface-700 p-6">
		<h2 class="text-2xl font-semibold mb-4">Settings</h2>
		<TabNav bind:value />
	</aside>

	<!-- Main content area -->
	<main class="flex-1 p-6 max-w-5xl">
		<!-- Tabs: list + content. We keep tabs state in this file and pass it down. -->
		<Tabs {value} onValueChange={(details) => (value = details.value)}>
			<Tabs.List>
				<Tabs.Trigger value="profile">Public profile</Tabs.Trigger>
				<Tabs.Trigger value="account">Account</Tabs.Trigger>
				<Tabs.Trigger value="preferences">Preferences</Tabs.Trigger>
				<Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
				<Tabs.Indicator />
			</Tabs.List>

			<Tabs.Content value="profile">
				<PublicProfile {displayName} {bio} {pronouns} on:save={handleSavePublicProfile} {toaster} />
			</Tabs.Content>

			<Tabs.Content value="account">
				<Account
					{username}
					{firstName}
					{lastName}
					{email}
					on:change={handleSaveAccount}
					{toaster}
				/>
			</Tabs.Content>

			<Tabs.Content value="preferences">
				<Preferences
					{themeMode}
					{accentColor}
					{typography}
					on:save={handleSavePreferences}
					{toaster}
				/>
			</Tabs.Content>

			<Tabs.Content value="notifications">
				<Notifications {desktopNotifications} on:save={handleSaveNotifications} {toaster} />
			</Tabs.Content>
		</Tabs>

		<!-- Toast group: place near the top-level to render toasts -->
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
