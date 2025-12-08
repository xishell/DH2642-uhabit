<script lang="ts">
	import DragSelectGrid from './DragSelectGrid.svelte';

	export let selectDays: number[] = [];

	const getOrdinal = (n: number) => {
		if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
		if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
		if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
		return `${n}th`;
	};

	const days = Array.from({ length: 31 }, (_, i) => getOrdinal(i + 1));

	function itemToValue(str: string): number {
		const match = str.match(/\d+/);
		return match ? Number(match[0]) : NaN;
	}
</script>

<DragSelectGrid items={days} {selectDays} {itemToValue} name="period" gridCols={7} />
