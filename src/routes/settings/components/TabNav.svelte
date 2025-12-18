<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	export let value: string;
</script>

<!-- This component only renders the tab triggers list for the left nav. -->
<Tabs {value} onValueChange={(details) => (value = details.value)}>
	<Tabs.List class="flex flex-col space-y-1">
		<Tabs.Trigger value="profile" class="text-left">Public profile</Tabs.Trigger>
		<Tabs.Trigger value="account" class="text-left">Account</Tabs.Trigger>
		<Tabs.Trigger value="preferences" class="text-left">Preferences</Tabs.Trigger>
		<Tabs.Trigger value="notifications" class="text-left">Notifications</Tabs.Trigger>
		<Tabs.Indicator />
	</Tabs.List>
</Tabs>
