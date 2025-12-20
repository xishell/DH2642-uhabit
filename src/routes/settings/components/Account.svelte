<script lang="ts">
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { XIcon } from '@lucide/svelte';

	export let username: string;
	export let email: string;

	export let onSave: (payload: { username: string; email: string }) => void;

	let openField: null | 'username' | 'email' = null;
	let value = '';

	const fields: ('username' | 'email')[] = ['username', 'email'];

	function open(field: typeof openField) {
		openField = field;
		value = { username, email }[field!];
	}

	function save() {
		if (value.length > 20) value = value.slice(0, 20);
		onSave({
			username: openField === 'username' ? value : username,
			email: openField === 'email' ? value : email
		});
		openField = null;
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Account</h1>

	<div class="card p-6 space-y-6">
		{#each fields as field}
			<div class="flex justify-between items-center">
				<div class="flex flex-col">
					<span class="font-semibold capitalize">{field}</span>
					<span class="text-surface-500">{field === 'username' ? username : email}</span>
				</div>
				<button
					class="px-3 py-1 rounded bg-primary-500 text-white hover:bg-primary-600"
					on:click={() => open(field)}
				>
					Edit
				</button>
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
							<h2 class="font-bold text-lg">Edit {openField}</h2>
							<button on:click={() => (openField = null)}>
								<XIcon class="size-4" />
							</button>
						</header>

						<p class="text-sm text-error-500">
							Warning: Making these changes could have negative effects.
						</p>

						<input
							class="input w-full"
							bind:value
							maxlength={20}
							placeholder={openField === 'username'
								? 'Enter username (max 20)'
								: 'Enter email (max 50)'}
						/>

						<footer class="flex justify-end gap-2">
							<button
								class="border border-secondary-500 text-secondary-600 dark:text-secondary-400 px-4 py-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-colors"
								on:click={() => (openField = null)}
							>
								Cancel
							</button>
							<button class="bg-primary-500 text-white px-4 py-2 rounded" on:click={save}>
								Save
							</button>
						</footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog>
	{/if}
</section>
