<script lang="ts">
	export let selectDays: number[] = [];
	const getOrdinal = (n: number) => {
		if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
		if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
		if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
		return `${n}th`;
	};
	const days = Array.from({ length: 31 }, (_, i) => getOrdinal(i + 1));

	let selected = new Set<string>();
	let isDragging = false;
	let dragMode: 'select' | 'deselect' | null = null;

	$: if (selectDays?.length > 0) {
		selected = new Set(days.filter((d) => selectDays.includes(ordinalToNumber(d))));
	}
	$: monthdaySelected = Array.from(selected)
		.map((day) => ordinalToNumber(day))
		.sort((a, b) => a - b);

	function ordinalToNumber(str: string): number {
		const match = str.match(/\d+/);
		return match ? Number(match[0]) : NaN;
	}
	function updateSet() {
		selected = new Set(selected);
	}

	function startDrag(day: string, e?: TouchEvent | MouseEvent) {
		e?.preventDefault();

		isDragging = true;

		if (selected.has(day)) {
			dragMode = 'deselect';
			selected.delete(day);
		} else {
			dragMode = 'select';
			selected.add(day);
		}
		updateSet();
	}

	function dragOver(day: string) {
		if (!isDragging || !dragMode) return;

		if (dragMode === 'select') selected.add(day);
		if (dragMode === 'deselect') selected.delete(day);

		updateSet();
	}

	function endDrag() {
		isDragging = false;
		dragMode = null;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;

		const touch = e.touches[0];
		const target = document.elementFromPoint(touch.clientX, touch.clientY);
		const day = target?.getAttribute('data-day');

		if (day) dragOver(day);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="grid grid-cols-7 gap-1.5 select-none touch-none"
	on:mouseup={endDrag}
	on:mouseleave={endDrag}
	on:touchend={endDrag}
	on:touchcancel={endDrag}
	on:touchmove={handleTouchMove}
>
	{#each days as day, i}
		<div
			data-day={day}
			class="h-8 text-xs font-medium flex items-center justify-center rounded-full
				cursor-pointer transition-all duration-200
				{selected.has(day)
				? 'bg-surface-900-50 text-surface-50-900'
				: 'border border-surface-300-600 text-surface-500 hover:border-surface-500'}"
			on:mousedown={(e) => startDrag(day, e)}
			on:touchstart={(e) => startDrag(day, e)}
			on:mouseenter={() => dragOver(day)}
		>
			{day}
		</div>
	{/each}
</div>
<input type="hidden" name="period" value={monthdaySelected} />
