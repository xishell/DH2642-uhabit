<script lang="ts">
	// Generic drag-to-select grid component
	export let items: string[]; // Array of items to display
	export let selectDays: number[] = []; // Array of selected values (as numbers)
	export let itemToValue: (item: string) => number; // Function to convert item to value
	export let name: string = 'period'; // Name for the hidden input field
	export let gridCols: number = 7; // Number of columns in the grid

	let isDragging = false;
	let dragMode: 'select' | 'deselect' | null = null;
	let selected = new Set<string>();

	// Initialize selected items from selectDays prop
	$: if (selectDays?.length > 0) {
		selected = new Set(items.filter((item) => selectDays.includes(itemToValue(item))));
	}

	// Convert selected items back to values for the form
	$: selectedValues = Array.from(selected)
		.map((item) => itemToValue(item))
		.sort((a, b) => a - b);

	function updateSet() {
		selected = new Set(selected);
	}

	function startDrag(item: string, e?: TouchEvent | MouseEvent) {
		e?.preventDefault();
		isDragging = true;

		if (selected.has(item)) {
			dragMode = 'deselect';
			selected.delete(item);
		} else {
			dragMode = 'select';
			selected.add(item);
		}
		updateSet();
	}

	function dragOver(item: string) {
		if (!isDragging || !dragMode) return;

		if (dragMode === 'select') selected.add(item);
		if (dragMode === 'deselect') selected.delete(item);

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
		const item = target?.getAttribute('data-item');

		if (item) dragOver(item);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="grid gap-[1px] select-none touch-none rounded-md overflow-clip"
	style="grid-template-columns: repeat({gridCols}, minmax(0, 1fr));"
	on:mouseup={endDrag}
	on:mouseleave={endDrag}
	on:touchend={endDrag}
	on:touchcancel={endDrag}
	on:touchmove={handleTouchMove}
>
	{#each items as item}
		<div
			data-item={item}
			class="
				h-10 text-sm sm:text-[13px] sm:h-8 flex items-center justify-center
				cursor-pointer transition-all duration-150 opacity-80
				{selected.has(item)
				? 'bg-primary-500 text-primary-50 hover:bg-primary-400'
				: 'bg-primary-50 text-primary-700 hover:bg-primary-100'}
			"
			on:mousedown={(e) => startDrag(item, e)}
			on:touchstart={(e) => startDrag(item, e)}
			on:mouseenter={() => dragOver(item)}
		>
			{item}
		</div>
	{/each}
</div>
<input type="hidden" {name} value={selectedValues} />
