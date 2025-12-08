<script lang="ts">
	import DragSelectGrid from './DragSelectGrid.svelte';

	export let selectDays: number[] = [];

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const weekdayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};

	function itemToValue(day: string): number {
		return weekdayMap[day];
	}
</script>

<DragSelectGrid items={days} {selectDays} {itemToValue} name="period" gridCols={7} />
