<script lang="ts">
	import { fly } from 'svelte/transition';
	import { hasUnsavedChanges, changedFields, settingsChanges } from '$lib/stores/settingsChanges';

	interface Props {
		onSave: () => Promise<void>;
		onDiscard: () => void;
		isSaving?: boolean;
		isMobile?: boolean;
	}

	let { onSave, onDiscard, isSaving = false, isMobile = false }: Props = $props();

	const fieldLabels: Record<string, string> = {
		name: 'Display name',
		bio: 'Bio',
		pronouns: 'Pronouns',
		username: 'Username',
		email: 'Email',
		theme: 'Theme',
		accentColor: 'Accent color',
		typography: 'Typography',
		notifications: 'Notifications'
	};

	const changedFieldsList = $derived(
		Array.from($changedFields)
			.map((f) => fieldLabels[f] || f)
			.join(', ')
	);

	async function handleSave() {
		await onSave();
	}

	function handleDiscard() {
		onDiscard();
		settingsChanges.clearAll();
	}
</script>

{#if $hasUnsavedChanges}
	<div
		class="fixed left-0 right-0 z-50 p-4 pointer-events-none"
		class:bottom-0={!isMobile}
		class:bottom-16={isMobile}
		transition:fly={{ y: 100, duration: 200 }}
	>
		<div
			class="max-w-2xl mx-auto bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-xl shadow-lg p-4 pointer-events-auto"
		>
			<div class="flex items-center justify-between gap-4">
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-surface-900 dark:text-surface-50">Unsaved changes</p>
					<p class="text-xs text-surface-500 truncate">
						Modified: {changedFieldsList}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="px-4 py-2 text-sm rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
						onclick={handleDiscard}
						disabled={isSaving}
					>
						Discard
					</button>
					<button
						type="button"
						class="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
						onclick={handleSave}
						disabled={isSaving}
					>
						{isSaving ? 'Saving...' : 'Save changes'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
