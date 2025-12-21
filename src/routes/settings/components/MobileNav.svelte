<script lang="ts">
	import { onMount } from 'svelte';
	import { User, Settings, Palette, Bell } from 'lucide-svelte';

	const sections = [
		{ id: 'profile', label: 'Profile', icon: User },
		{ id: 'account', label: 'Account', icon: Settings },
		{ id: 'preferences', label: 'Theme', icon: Palette },
		{ id: 'notifications', label: 'Alerts', icon: Bell }
	];

	let activeSection = $state('profile');

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			activeSection = id;
		}
	}

	onMount(() => {
		const sectionEls = sections
			.map((s) => document.getElementById(s.id))
			.filter((el): el is HTMLElement => el !== null);

		if (sectionEls.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Find the most visible section
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);

				if (visible.length > 0) {
					activeSection = visible[0].target.id;
				}
			},
			{
				rootMargin: '-20% 0px -60% 0px',
				threshold: [0, 0.25, 0.5, 0.75, 1]
			}
		);

		sectionEls.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-40 bg-surface-100 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 safe-area-bottom"
>
	<div class="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
		{#each sections as section}
			{@const isActive = activeSection === section.id}
			<button
				type="button"
				class="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
				class:text-primary-600={isActive}
				class:dark:text-primary-400={isActive}
				class:text-surface-500={!isActive}
				class:dark:text-surface-400={!isActive}
				onclick={() => scrollTo(section.id)}
			>
				<section.icon class="size-5" strokeWidth={isActive ? 2.5 : 2} />
				<span class="text-xs font-medium">{section.label}</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom, 0);
	}
</style>
