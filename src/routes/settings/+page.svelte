<script lang="ts">
	import { onMount } from 'svelte';
	import { Toast, createToaster, Collapsible } from '@skeletonlabs/skeleton-svelte';
	import { ArrowUpDownIcon } from '@lucide/svelte';

	import PublicProfile from './components/PublicProfile.svelte';
	import Account from './components/Account.svelte';
	import Preferences from './components/Preferences.svelte';
	import Notifications from './components/Notifications.svelte';
	import TabNav from './components/TabNav.svelte';

	const toaster = createToaster();

	// ------------------
	// Mock state
	// ------------------
	let displayName = 'John Doe';
	let bio = 'Tell the world about yourself';
	let pronouns = 'they/them';

	let username = 'johndoe';
	let email = 'john@example.com';

	let themeMode: 'light' | 'dark' = 'light';
	let accentColor = 'indigo';
	let typography = 'sans';

	let desktopNotifications = true;

	// ------------------
	// Mobile detection (page-only)
	// ------------------
	let isMobile = false;

	onMount(() => {
		const update = () => (isMobile = window.innerWidth < 768);
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
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
