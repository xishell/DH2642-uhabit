<script lang="ts">
	// Props for current account info
	export let username: string;
	export let firstName: string;
	export let lastName: string;
	export let email: string;

	// Callback to parent when a field needs to be changed
	export let onChange: (payload: {
		field: 'username' | 'firstName' | 'lastName' | 'email';
	}) => void;

	function change(field: 'username' | 'firstName' | 'lastName' | 'email') {
		onChange({ field }); // <-- wrap in object to match type
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Account</h1>

	<div class="card p-6 space-y-4">
		<div class="flex justify-between items-center">
			<span>Username: <strong>{username}</strong></span>
			<button
				class="px-3 py-1 rounded-md border hover:bg-gray-100"
				on:click={() => change('username')}
			>
				Change
			</button>
		</div>

		<div class="flex justify-between items-center">
			<span>First name: <strong>{firstName}</strong></span>
			<button
				class="px-3 py-1 rounded-md border hover:bg-gray-100"
				on:click={() => change('firstName')}
			>
				Change
			</button>
		</div>

		<div class="flex justify-between items-center">
			<span>Last name: <strong>{lastName}</strong></span>
			<button
				class="px-3 py-1 rounded-md border hover:bg-gray-100"
				on:click={() => change('lastName')}
			>
				Change
			</button>
		</div>

		<div class="flex justify-between items-center">
			<span>Email: <strong>{email}</strong></span>
			<button
				class="px-3 py-1 rounded-md border hover:bg-gray-100"
				on:click={() => change('email')}
			>
				Change
			</button>
		</div>
	</div>
</section>
