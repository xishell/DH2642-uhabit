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

<div class="flex justify-center">
	<div class="card p-8 flex gap-6 items-center max-w-lg mt-[-20px]">
		<!-- Avatar -->
		<Avatar class="h-20 w-20">
			<Avatar.Fallback class="bg-primary-500 text-white font-bold text-xl flex items-center justify-center">
				{initials}
			</Avatar.Fallback>
		</Avatar>

		<!-- Info -->
		<div class="flex-1">
			<h3 class="font-semibold text-2xl">
				{displayName || 'Your name'}
			</h3>

			<p class="text-sm opacity-80 mt-1">
				{bio || 'Your bio will appear here.'}
			</p>

			{#if pronouns}
				<p class="text-xs opacity-60 mt-1">{pronouns}</p>
			{/if}
		</div>
	</div>
</div>
