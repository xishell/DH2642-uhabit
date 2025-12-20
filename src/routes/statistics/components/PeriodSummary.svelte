<script lang="ts">
	import type { PeriodStats, HabitTrend, HeatCell, Scope } from '$lib/stats/types';

	interface Props {
		periodStats: PeriodStats;
		trends: HabitTrend[];
		heatmap: HeatCell[];
		activeTab: Scope;
		isSyncing: boolean;
		lastSyncLabel: () => string;
		cardBase: string;
	}

	let { periodStats, trends, heatmap, activeTab, isSyncing, lastSyncLabel, cardBase }: Props =
		$props();

	const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

	const heatBucket = (value: number) => {
		const v = Math.max(0, Math.min(1, value));
		if (v >= 0.8) return 'bg-primary-500/95 shadow-[0_2px_6px_rgba(0,0,0,0.35)]';
		if (v >= 0.6) return 'bg-primary-400/90 shadow-[0_2px_5px_rgba(0,0,0,0.3)]';
		if (v >= 0.4) return 'bg-primary-300/90 shadow-[0_1px_4px_rgba(0,0,0,0.25)]';
		if (v >= 0.2) return 'bg-primary-200/85 shadow-[0_1px_3px_rgba(0,0,0,0.2)]';
		return 'bg-surface-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.15)]';
	};

	function chunkHeatmap(cells: HeatCell[], size: number) {
		const rows: HeatCell[][] = [];
		for (let i = 0; i < cells.length; i += size) {
			rows.push(cells.slice(i, i + size));
		}
		return rows;
	}

	const heatmapGrid = $derived(chunkHeatmap(heatmap, 12));
</script>

<div class={`${cardBase} p-4 lg:col-span-2 flex flex-col gap-4`}>
	<div class="flex items-center justify-between">
		<div>
			<p class="text-xs uppercase tracking-wide text-surface-400">Period</p>
			<p class="text-lg font-semibold">{periodStats.rangeLabel}</p>
		</div>
		<span class="text-sm text-surface-400">
			{#if isSyncing}
				Syncing...
			{:else}
				Updated {lastSyncLabel()}
			{/if}
		</span>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#key activeTab}
			{#each [['Completion', formatPercent(periodStats.completionRate)], ['Completions', periodStats.completions.toString()], ['Best day', periodStats.bestDay], ['Streak', `${periodStats.streak} (best ${periodStats.longestStreak})`]] as [label, value]}
				<div
					class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 py-2 text-surface-900 dark:text-surface-50"
				>
					<p class="text-xs text-surface-400">{label}</p>
					<p class="text-lg font-semibold">{value}</p>
				</div>
			{/each}
		{/key}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div
			class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 text-surface-900 dark:text-surface-50"
		>
			<p class="text-sm font-semibold mb-3">Recent momentum</p>
			<div class="flex items-end gap-2 h-28">
				{#key activeTab}
					{#if trends.length > 0 && trends[0].spark.length > 0}
						{#each trends[0].spark as value, idx}
							<div
								class="flex-1 rounded-full bg-primary-200"
								style={`height:${20 + value * 70}%`}
								aria-label={`Day ${idx + 1} value ${formatPercent(value)}`}
							></div>
						{/each}
					{:else}
						<p class="text-sm text-surface-400 m-auto">No data yet</p>
					{/if}
				{/key}
			</div>
			{#if trends.length > 0}
				<p class="text-xs text-surface-400 mt-2">
					{trends[0].title}, last {trends[0].spark.length} periods
				</p>
			{/if}
		</div>

		<div
			class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 text-surface-900 dark:text-surface-50"
		>
			<p class="text-sm font-semibold mb-3">Consistency heatmap</p>
			<div class="pb-2">
				{#key activeTab}
					{#if heatmapGrid.length > 0}
						<div class="flex flex-col gap-1">
							{#each heatmapGrid as row, rowIdx (rowIdx)}
								<div class="grid grid-cols-12 gap-1">
									{#each row as cell (cell.date)}
										<div
											class={`heat-cell h-4 w-4 rounded-[2px] outline outline-1 outline-surface-300 dark:outline-surface-700/70 ${heatBucket(cell.value)}`}
											title={`${cell.date} — ${formatPercent(cell.value)}`}
										></div>
									{/each}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-surface-400">No data yet</p>
					{/if}
				{/key}
			</div>
			<div class="flex items-center gap-2 mt-3 text-xs text-surface-400">
				<span>Less</span>
				<div class="flex items-center gap-1">
					{#each [0, 0.2, 0.4, 0.6, 0.8] as level (level)}
						<div
							class={`heat-cell w-4 h-3 rounded-[2px] outline outline-1 outline-surface-300 dark:outline-surface-700/70 ${heatBucket(level)}`}
						></div>
					{/each}
				</div>
				<span>More</span>
				<span class="ml-auto">
					Streak: {periodStats.streak} / Best: {periodStats.longestStreak}
				</span>
			</div>
		</div>
	</div>
</div>
