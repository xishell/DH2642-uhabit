<script lang="ts">
	const sections = [
		{ id: 'profile', label: 'Public profile' },
		{ id: 'account', label: 'Account' },
		{ id: 'preferences', label: 'Preferences' },
		{ id: 'notifications', label: 'Notifications' }
	];

	function scrollTo(id: string) {
		document.getElementById(id)?.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}
</script>

<nav class="space-y-1">
	{#each sections as section}
		<button
			type="button"
			class="w-full text-left px-3 py-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-500 transition"
			on:click={() => scrollTo(section.id)}
		>
			{section.label}
		</button>
	{/each}
</nav>
