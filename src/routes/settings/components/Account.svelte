<script lang="ts">
	import { untrack } from 'svelte';
	import EditFieldDialog from '$lib/components/EditFieldDialog.svelte';
	import FieldWrapper from './FieldWrapper.svelte';

	interface Props {
		username: string;
		email: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { username, email, onFieldChange }: Props = $props();

	let draftUsername = $state(untrack(() => username));
	let draftEmail = $state(untrack(() => email));

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
			onFieldChange?.('username', editValue);
		} else if (openField === 'email') {
			draftEmail = editValue;
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

	<EditFieldDialog
		open={openField !== null}
		title="Edit {openField}"
		bind:value={editValue}
		maxlength={openField === 'username' ? 20 : 50}
		placeholder={openField === 'username' ? 'Enter username (max 20)' : 'Enter email (max 50)'}
		warningText="Making these changes could have negative effects."
		onApply={applyEdit}
		onCancel={cancelEdit}
	/>
</section>
