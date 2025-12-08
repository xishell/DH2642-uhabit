<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';

	export let p: {
		id: string;
		title: string;
		progress: number;
		targetAmount: number;
	};

	export let onOpen: () => void;
	export const onChange: (delta: number) => void = () => {};

	$: pct = p.targetAmount > 0 ? Math.min(100, Math.round((p.progress / p.targetAmount) * 100)) : 0;

	function handleClick() {
		onOpen?.();
	}
</script>

<button
	type="button"
	aria-label={`Open ${p.title}`}
	on:click={handleClick}
	class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-2 w-full text-left"
>
	<div class="flex items-center justify-between">
		<div class="font-medium text-sm">{p.title}</div>
		<div class="text-xs text-surface-500">{p.progress}/{p.targetAmount}</div>
	</div>

	<!-- Skeleton UI v4 Linear Progress -->
	<Progress value={pct} max={100} class="h-2 rounded-full">
		<Progress.Label class="sr-only" />
		<Progress.ValueText class="sr-only" />
	</Progress>
</button>
