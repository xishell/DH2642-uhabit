<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { AlertTriangle } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		open = false,
		title = 'Confirm',
		confirmLabel = 'Confirm',
		onconfirm,
		oncancel,
		children
	}: {
		open: boolean;
		title?: string;
		confirmLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
		children: Snippet;
	} = $props();
</script>

{#if open}
	<Dialog open>
		<Portal>
			<Dialog.Backdrop class="fixed inset-0 bg-black/50 z-50" />
			<Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-50">
				<Dialog.Content
					class="card bg-surface-100 dark:bg-surface-900 p-6 w-full max-w-sm space-y-4 shadow-xl rounded-xl"
				>
					<header class="flex items-center gap-3">
						<div class="p-2 rounded-full bg-error-100 dark:bg-error-900/30">
							<AlertTriangle class="size-5 text-error-600 dark:text-error-400" />
						</div>
						<h2 class="font-bold text-lg">{title}</h2>
					</header>

					<div class="text-sm text-surface-600 dark:text-surface-400">
						{@render children()}
					</div>

					<footer class="flex justify-end gap-3 pt-2">
						<button
							type="button"
							class="px-4 py-2 text-sm rounded-md border border-surface-300 dark:border-surface-600 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
							onclick={oncancel}
						>
							Cancel
						</button>
						<button
							type="button"
							class="px-4 py-2 text-sm rounded-md bg-error-600 text-white hover:bg-error-700 transition-colors"
							onclick={onconfirm}
						>
							{confirmLabel}
						</button>
					</footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Portal>
	</Dialog>
{/if}
