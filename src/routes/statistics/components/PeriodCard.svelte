<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	export let title: string;
	export let contents: string;
</script>

<div
	class="period-card overflow-hidden shrink-0 flex-1 flex-col p-4 gap-1 border border-surface-700 bg-surface-800 rounded-xl"
>
	<div class="text-sm text-surface-400">
		{title}
	</div>
	<div class="text-lg font-semibold text-nowrap">{contents}</div>
</div>
