<script lang="ts"> 
	import { Input, Button, Alert } from '@skeletonlabs/skeleton';
	import { signIn } from '$lib/auth/client';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	async function handleSubmit() {
		errorMessage = null;
		loading = true;

		try {
			await signIn(email, password);
			window.location.href = '/overview';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-4 bg-surface-100 dark:bg-surface-800 p-6 rounded-xl shadow-md"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-2xl font-semibold text-center mb-2">Login</h1>

	{#if errorMessage}
		<Alert variant="error" class="mb-4">
			{errorMessage}
		</Alert>
	{/if}

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
		Login
	</Button>

	<p class="text-center text-sm text-surface-500 mt-4">
		New here?
		<a href="/auth/register" class="text-primary-600 hover:underline">
			Create an account
		</a>
	</p>
</form>
