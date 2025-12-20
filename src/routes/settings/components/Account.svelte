<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { XIcon } from '@lucide/svelte';
	import { settingsChanges } from '$lib/stores/settingsChanges';
	import FieldWrapper from './FieldWrapper.svelte';

	interface Props {
		username: string;
		email: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { username, email, onFieldChange }: Props = $props();

	let draftUsername = $state(username);
	let draftEmail = $state(email);

	let openField: null | 'username' | 'email' = $state(null);
	let editValue = $state('');

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftUsername = username;
	});

	$effect(() => {
		draftEmail = email;
	});

	function open(field: 'username' | 'email') {
		openField = field;
		editValue = field === 'username' ? draftUsername : draftEmail;
	}

	function applyEdit() {
		if (editValue.length > 20) editValue = editValue.slice(0, 20);

		if (openField === 'username') {
			draftUsername = editValue;
			settingsChanges.setField('username', username, editValue);
			onFieldChange?.('username', editValue);
		} else if (openField === 'email') {
			draftEmail = editValue;
			settingsChanges.setField('email', email, editValue);
			onFieldChange?.('email', editValue);
		}

		openField = null;
	}

	function cancelEdit() {
		openField = null;
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Account</h1>

	<div class="card p-6 space-y-6">
		<FieldWrapper field="username" label="Username">
			<div class="flex justify-between items-center">
				<span class="text-surface-600 dark:text-surface-400">{draftUsername}</span>
				<button
					class="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
					onclick={() => open('username')}
				>
					Edit
				</button>
			</div>
		</FieldWrapper>

		<FieldWrapper field="email" label="Email">
			<div class="flex justify-between items-center">
				<span class="text-surface-600 dark:text-surface-400">{draftEmail}</span>
				<button
					class="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
					onclick={() => open('email')}
				>
					Edit
				</button>
			</div>
		</FieldWrapper>
	</div>

	{#if openField}
		<Dialog open>
			<Portal>
				<Dialog.Backdrop class="fixed inset-0 bg-black/40" />
				<Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
					<Dialog.Content
						class="card bg-surface-100 dark:bg-surface-900 p-6 w-full max-w-md space-y-4 shadow-lg rounded-md"
					>
						<header class="flex justify-between items-center">
							<h2 class="font-bold text-lg">Edit {openField}</h2>
							<button onclick={cancelEdit}>
								<XIcon class="size-4" />
							</button>
						</header>

						<p class="text-sm text-warning-600 dark:text-warning-400">
							Warning: Making these changes could have negative effects.
						</p>

						<input
							class="input w-full border border-surface-300 dark:border-surface-600"
							bind:value={editValue}
							maxlength={openField === 'username' ? 20 : 50}
							placeholder={openField === 'username'
								? 'Enter username (max 20)'
								: 'Enter email (max 50)'}
						/>

						<footer class="flex justify-end gap-2">
							<button
								class="border border-surface-300 dark:border-surface-600 px-4 py-2 rounded hover:bg-surface-200 dark:hover:bg-surface-700"
								onclick={cancelEdit}
							>
								Cancel
							</button>
							<button
								class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
								onclick={applyEdit}
							>
								Apply
							</button>
						</footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog>
	{/if}
</section>
