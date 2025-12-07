<script lang="ts">
	export let selectDays: number[] = [];
	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	let isDragging = false;
	let dragMode: 'select' | 'deselect' | null = null;

	let selected = new Set<string>();
	const weekdayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};

	$: if (selectDays?.length > 0) {
		selected = new Set(days.filter((d) => selectDays.includes(weekdayMap[d])));
	}

	$: weekdaySelected = Array.from(selected)
		.map((day) => weekdayMap[day])
		.sort((a, b) => a - b);

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
		console.log(selected);
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
	class="flex gap-2 select-none touch-none"
	on:mouseup={endDrag}
	on:mouseleave={endDrag}
	on:touchend={endDrag}
	on:touchcancel={endDrag}
	on:touchmove={handleTouchMove}
>
	{#each days as day}
		<div
			data-day={day}
			class="size-9 text-xs font-medium flex items-center justify-center rounded-full
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
<input type="hidden" name="period" value={weekdaySelected} />
