import type { Action } from 'svelte/action';

/**
 * Options for the drag-resize action
 */
export interface DragResizeOptions {
	/** The ID of the element to resize (used to calculate bounds) */
	targetId: string;
	/** Minimum allowed height in pixels */
	minHeight?: number;
	/** Maximum allowed height in pixels */
	maxHeight?: number;
	/** Callback fired when height changes during drag */
	onHeightChange: (height: number) => void;
	/** Callback fired when drag state changes (start/end) */
	onDragStateChange?: (isDragging: boolean) => void;
}

/**
 * Svelte action for drag-to-resize functionality.
 * Attach to a handle element that the user drags to resize a target element.
 *
 * @example
 * <div id="resizable-panel" style="height: {height}px">
 *   Content here
 * </div>
 * <div
 *   use:dragResize={{
 *     targetId: 'resizable-panel',
 *     minHeight: 100,
 *     maxHeight: 500,
 *     onHeightChange: (h) => height = h,
 *     onDragStateChange: (d) => isDragging = d
 *   }}
 *   class="resize-handle"
 * ></div>
 */
export const dragResize: Action<HTMLElement, DragResizeOptions> = (node, options) => {
	let active = false;
	let currentOptions = options;

	const minHeight = currentOptions.minHeight ?? 16;
	const maxHeight = currentOptions.maxHeight ?? 520;

	function onPointerDown(event: MouseEvent | TouchEvent) {
		event.preventDefault();
		active = true;
		currentOptions.onDragStateChange?.(true);

		window.addEventListener('mousemove', onPointerMove);
		window.addEventListener('mouseup', onPointerUp);
		window.addEventListener('touchmove', onPointerMove as EventListener, { passive: false });
		window.addEventListener('touchend', onPointerUp);
	}

	function onPointerMove(event: MouseEvent | TouchEvent) {
		if (!active) return;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		updateHeight(clientY);
	}

	function onPointerUp() {
		active = false;
		currentOptions.onDragStateChange?.(false);

		window.removeEventListener('mousemove', onPointerMove);
		window.removeEventListener('mouseup', onPointerUp);
		window.removeEventListener('touchmove', onPointerMove as EventListener);
		window.removeEventListener('touchend', onPointerUp);
	}

	function updateHeight(clientY: number) {
		const targetEl = document.getElementById(currentOptions.targetId);
		if (!targetEl) return;

		const targetTop = targetEl.getBoundingClientRect().top;
		const newHeight = Math.min(Math.max(clientY - targetTop, minHeight), maxHeight);
		currentOptions.onHeightChange(newHeight);
	}

	node.addEventListener('mousedown', onPointerDown);
	node.addEventListener('touchstart', onPointerDown, { passive: false });

	return {
		update(newOptions: DragResizeOptions) {
			currentOptions = newOptions;
		},
		destroy() {
			node.removeEventListener('mousedown', onPointerDown);
			node.removeEventListener('touchstart', onPointerDown);
			// Clean up any lingering listeners
			window.removeEventListener('mousemove', onPointerMove);
			window.removeEventListener('mouseup', onPointerUp);
			window.removeEventListener('touchmove', onPointerMove as EventListener);
			window.removeEventListener('touchend', onPointerUp);
		}
	};
};
