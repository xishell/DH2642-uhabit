<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { XIcon } from '@lucide/svelte';

	export let username: string;
	export let firstName: string;
	export let lastName: string;
	export let email: string;

	export let onSave: (payload: {
		username: string;
		firstName: string;
		lastName: string;
		email: string;
	}) => void;

	let openField: null | 'username' | 'firstName' | 'lastName' | 'email' = null;
	let value = '';

	function open(field: typeof openField) {
		openField = field;
		value = { username, firstName, lastName, email }[field!];
	}

	function save() {
		onSave({
			username: openField === 'username' ? value : username,
			firstName: openField === 'firstName' ? value : firstName,
			lastName: openField === 'lastName' ? value : lastName,
			email: openField === 'email' ? value : email
		});
		openField = null;
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Account</h1>

	<div class="card p-6 space-y-4">
		{#each [['username', username], ['firstName', firstName], ['lastName', lastName], ['email', email]] as [field, val]}
			<div class="flex justify-between items-center">
				<span>{field}: <strong>{val}</strong></span>
				<button class="border px-3 py-1 rounded" on:click={() => open(field)}> Change </button>
			</div>
		{/each}
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
							<h2 class="font-bold text-lg">Change {openField}</h2>
							<button on:click={() => (openField = null)}>
								<XIcon class="size-4" />
							</button>
						</header>

						<p class="text-sm text-red-500">
							Warning: Making these changes could have negative effects.
						</p>

						<input class="input w-full" bind:value />

						<footer class="flex justify-end gap-2">
							<button class="border px-4 py-2 rounded" on:click={() => (openField = null)}>
								Cancel
							</button>
							<button class="bg-indigo-600 text-white px-4 py-2 rounded" on:click={save}>
								Save
							</button>
						</footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog>
	{/if}
</section>
