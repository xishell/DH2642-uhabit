<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	export let displayName: string;
	export let bio: string;
	export let pronouns: string;

	const initials = displayName
		?.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase() || '👤';
</script>

<div class="card p-6 flex gap-4 items-center max-w-md">
	<!-- Avatar -->
	<Avatar class="h-14 w-14">
		<Avatar.Fallback class="bg-primary-500 text-white font-semibold">
			{initials}
		</Avatar.Fallback>
	</Avatar>

	<!-- Info -->
	<div class="flex-1">
		<h3 class="font-semibold text-lg">
			{displayName || 'Your name'}
		</h3>

		<p class="text-sm opacity-70">
			{bio || 'Your bio will appear here.'}
		</p>

		{#if pronouns}
			<p class="text-xs opacity-50 mt-1">{pronouns}</p>
		{/if}
	</div>
</div>
