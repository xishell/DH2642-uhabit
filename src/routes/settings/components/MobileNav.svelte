<script lang="ts">
	import { Collapsible } from '@skeletonlabs/skeleton-svelte';
	import { ArrowUpDownIcon } from '@lucide/svelte';

	function go(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
	<Collapsible class="card preset-filled-surface-100-900 px-4 py-3 w-64 shadow-xl">
		<div class="flex justify-between items-center">
			<p class="font-semibold text-sm">Settings</p>
			<Collapsible.Trigger class="btn-icon hover:preset-tonal scale-90">
				<ArrowUpDownIcon class="size-4" />
			</Collapsible.Trigger>
		</div>
		<Collapsible.Content class="mt-3 flex flex-col gap-2">
			<button class="anchor text-left text-sm" onclick={() => go('profile')}>Public profile</button>
			<button class="anchor text-left text-sm" onclick={() => go('account')}>Account</button>
			<button class="anchor text-left text-sm" onclick={() => go('preferences')}>Preferences</button
			>
			<button class="anchor text-left text-sm" onclick={() => go('notifications')}
				>Notifications</button
			>
		</Collapsible.Content>
	</Collapsible>
</div>
