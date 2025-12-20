<script lang="ts">
	import { Menu } from 'lucide-svelte';
	let open = $state(false);
</script>

<div class="relative">
	<button
		class="p-2 rounded-md hover:bg-surface-100"
		onclick={() => (open = !open)}
		aria-expanded={open}><Menu class="w-6 h-6" /></button
	>
	{#if open}
		<ul class="absolute right-0 mt-2 bg-surface-50 dark:bg-surface-800 shadow rounded-md w-44 z-40">
			<li>
				<a
					href="/overview"
					data-sveltekit-preload-data="hover"
					class="block px-4 py-2 hover:bg-surface-50">Overview</a
				>
			</li>
			<li>
				<a
					href="/habits/new"
					data-sveltekit-preload-data="hover"
					class="block px-4 py-2 hover:bg-surface-50">Create</a
				>
			</li>
			<li>
				<a
					href="/statistics"
					data-sveltekit-preload-data="hover"
					class="block px-4 py-2 hover:bg-surface-50">Statistics</a
				>
			</li>
			<li>
				<a
					href="/settings"
					data-sveltekit-preload-data="hover"
					class="block px-4 py-2 hover:bg-surface-50">Settings</a
				>
			</li>
		</ul>
	{/if}
</div>
