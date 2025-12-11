<script lang="ts">
	import { X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	let {
		open = false,
		title = '',
		onclose,
		children
	}: {
		open: boolean;
		title?: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-black/50"
			transition:fade={{ duration: 200 }}
			onclick={handleBackdropClick}
			onkeydown={(e) => e.key === 'Enter' && onclose()}
			role="button"
			tabindex="-1"
		></div>

		<!-- Modal content -->
		<div
			class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-50-900 rounded-xl shadow-xl"
			transition:fly={{ y: 20, duration: 200 }}
		>
			<!-- Header -->
			<div
				class="sticky top-0 flex items-center justify-between p-4 border-b border-surface-200-700 bg-surface-50-900 rounded-t-xl"
			>
				<h2 id="modal-title" class="text-lg font-semibold">{title}</h2>
				<button
					type="button"
					class="p-1 rounded-full hover:bg-surface-200-700 transition-colors"
					onclick={onclose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Body -->
			<div class="p-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
