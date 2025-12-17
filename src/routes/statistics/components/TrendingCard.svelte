<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	export let title: string;
	export let delta: number;
	export let progress: number;
	export let streak: number;
</script>

<div
	class="trending-card shrink-0 w-64 sm:w-full flex flex-col p-4 gap-1 border border-surface-700 bg-surface-800 rounded-xl"
>
	<div class="flex justify-between items-baseline">
		<div class="text-md text-surface-50 font-semibold">{title}</div>
		<div class="text-xs" class:text-primary-300={delta > 0} class:text-error-400={delta < 0}>
			{delta}%
		</div>
	</div>

	<div class="flex justify-between items-center gap-10">
		<div class="text-sm font-semibold text-surface-50">{progress}%</div>
		<Progress value={progress}>
			<Progress.Track class="h-1.5 bg-surface-700">
				<Progress.Range class="bg-primary-500" />
			</Progress.Track>
		</Progress>
	</div>

	<div class="text-xs text-surface-400">streaks: {streak} days</div>
</div>
