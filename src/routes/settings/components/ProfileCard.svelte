<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	export let displayName: string;
	export let bio: string;
	export let pronouns: string;

	// Reactive initials calculation
	$: initials =
		displayName
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || '👤';
</script>

<div class="flex justify-center">
	<div class="card p-8 flex gap-6 items-center max-w-lg mt-[-20px] relative">
		<!-- Avatar with Upload badge -->
		<div class="relative inline-block">
			<!-- Avatar -->
			<Avatar class="h-20 w-20">
				<Avatar.Fallback
					class="bg-primary-500 text-white font-bold text-xl flex items-center justify-center"
				>
					{initials}
				</Avatar.Fallback>
			</Avatar>

			<!-- "Upload" badge (centered bottom) -->
			<span
				class="absolute left-1/2 bottom-0 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-800 text-white cursor-pointer hover:bg-green-900 -translate-x-1/2 translate-y-1/2 whitespace-nowrap"
			>
				Upload
			</span>
		</div>

		<!-- Info -->
		<div class="flex-1">
			<h3 class="font-semibold text-2xl">{displayName || 'Your name'}</h3>

			<p class="text-sm opacity-80 mt-1">{bio || 'Your bio will appear here.'}</p>

			{#if pronouns}
				<p class="text-xs opacity-60 mt-1">{pronouns}</p>
			{/if}
		</div>
	</div>
</div>
