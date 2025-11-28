<script lang="ts">
	import { Input, Button, Alert } from '@skeletonlabs/skeleton';
	import { signUp } from '$lib/auth/client';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	async function handleSubmit() {
		errorMessage = null;
		loading = true;

		try {
			await signUp(email, password, name);
			window.location.href = '/overview';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-4 bg-surface-100 dark:bg-surface-800 p-6 rounded-xl shadow-md"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-2xl font-semibold text-center mb-2">Create an Account</h1>

	{#if errorMessage}
		<Alert variant="error" class="mb-4">
			{errorMessage}
		</Alert>
	{/if}

	<Input
		label="Name"
		type="text"
		bind:value={name}
		placeholder="Your name"
		required
	/>

	<Input
		label="Email"
		type="email"
		bind:value={email}
		placeholder="you@example.com"
		required
	/>

	<Input
		label="Password"
		type="password"
		bind:value={password}
		placeholder="••••••••"
		required
	/>

	<Button type="submit" class="w-full" loading={loading}>
		Create Account
	</Button>

	<p class="text-center text-sm text-surface-500 mt-4">
		Already have an account?
		<a href="/auth/login" class="text-primary-600 hover:underline">
			Sign in
		</a>
	</p>
</form>
