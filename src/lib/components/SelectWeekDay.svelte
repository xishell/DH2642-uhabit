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

	function valueToItem(value: number): string {
		return Object.keys(weekdayMap).find((key) => weekdayMap[key] === value) || '';
	}
</script>

<DragSelectGrid
	items={days}
	{selectDays}
	{itemToValue}
	{valueToItem}
	name="period"
	gridCols={7}
/>
