<script lang="ts">
	// Generic drag-to-select grid component
	let {
		items,
		selectDays = $bindable([]),
		itemToValue,
		name = 'period',
		gridCols = 7
	}: {
		items: string[];
		selectDays?: number[];
		itemToValue: (item: string) => number;
		name?: string;
		gridCols?: number;
	} = $props();

	let isDragging = $state(false);
	let dragMode = $state<'select' | 'deselect' | null>(null);
	let selected = $state(new Set<string>());
	let initialized = $state(false);

	// Initialize selected items from selectDays prop (only once)
	$effect(() => {
		if (!initialized && selectDays?.length > 0) {
			selected = new Set(items.filter((item) => selectDays.includes(itemToValue(item))));
			initialized = true;
		}
	});

	// Convert selected items back to values for the form
	const selectedValues = $derived(
		Array.from(selected)
			.map((item) => itemToValue(item))
			.sort((a, b) => a - b)
	);

	// Update the bound selectDays when selection changes
	$effect(() => {
		selectDays = selectedValues;
	});

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
	onmouseup={endDrag}
	onmouseleave={endDrag}
	ontouchend={endDrag}
	ontouchcancel={endDrag}
	ontouchmove={handleTouchMove}
>
	{#each items as item}
		<div
			data-item={item}
			class="
				h-10 text-sm sm:text-[13px] sm:h-8 flex items-center justify-center
				cursor-pointer transition-all duration-150 rounded-md border font-medium
				bg-surface-50-900 text-surface-900 dark:text-surface-50 hover:bg-surface-100-800
			"
			class:border-primary-500={selected.has(item)}
			class:ring-2={selected.has(item)}
			class:ring-primary-200={selected.has(item)}
			class:border-surface-200-700={!selected.has(item)}
			class:text-primary-900={selected.has(item)}
			onmousedown={(e) => startDrag(item, e)}
			ontouchstart={(e) => startDrag(item, e)}
			onmouseenter={() => dragOver(item)}
		>
			{item}
		</div>
	{/each}
</div>
<input type="hidden" {name} value={selectedValues} />
