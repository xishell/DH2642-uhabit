<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	export let displayName: string;
	export let bio: string;
	export let pronouns: string;

	const BIO_MAX_LENGTH = 100; // max characters before truncating

	// Initials calculation
	$: initials =
		displayName
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || '👤';

	// Display bio: truncate if too long, otherwise show normally
	$: displayBio =
		bio && bio.length > 0
			? bio.length > BIO_MAX_LENGTH
				? bio.slice(0, BIO_MAX_LENGTH) + '...'
				: bio
			: "Hey, I'm...";
</script>

<div class="flex justify-center w-full">
	<div class="card p-6 flex flex-col md:flex-row items-center gap-4 w-full max-w-md">
		<!-- Avatar with badge -->
		<div class="relative flex-shrink-0">
			<Avatar class="h-20 w-20">
				<Avatar.Fallback
					class="bg-primary-500 text-white font-bold text-xl flex items-center justify-center"
				>
					{initials}
				</Avatar.Fallback>
			</Avatar>

			<span
				class="absolute left-1/2 bottom-0 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success-800 text-white cursor-pointer hover:bg-success-900 -translate-x-1/2 translate-y-1/2 whitespace-nowrap"
			>
				Upload
			</span>
		</div>

		<!-- Info -->
		<div class="flex-1 min-w-0 mt-4 md:mt-0">
			<h3 class="font-semibold text-2xl">{displayName || 'Your name'}</h3>
			<p class="text-sm opacity-80 mt-1 break-words" title={bio}>
				{displayBio}
			</p>
			{#if pronouns}
				<p class="text-xs opacity-60 mt-1">{pronouns}</p>
			{/if}
		</div>
	</div>
</div>
