<script lang="ts">
	import '@skeletonlabs/skeleton-svelte'; // ensure skeleton is imported
	import { signIn } from '$lib/auth/client';

	let email = '';
	let password = '';
	let loading = false;
	let errorMessage: string | null = null;

	async function handleSubmit() {
		errorMessage = null;
		loading = true;
		try {
			await signIn(email, password);
			window.location.href = '/overview';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-6 max-w-md mx-auto p-6 bg-surface-100 dark:bg-surface-800 rounded-xl shadow-md"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-2xl font-semibold text-center">Login</h1>

	{#if errorMessage}
		<div class="p-3 bg-error-100 text-error-700 rounded">
			{errorMessage}
		</div>
	{/if}

	<div class="flex flex-col space-y-1">
		<label for="email" class="text-sm font-medium text-surface-700 dark:text-surface-200"
			>Email</label
		>
		<input
			id="email"
			type="email"
			bind:value={email}
			required
			class="input px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md
                  bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
	</div>

	<div class="flex flex-col space-y-1">
		<label for="password" class="text-sm font-medium text-surface-700 dark:text-surface-200"
			>Password</label
		>
		<input
			id="password"
			type="password"
			bind:value={password}
			required
			class="input px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md
                  bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
	</div>

	<button
		type="submit"
		class="btn variant-filled w-full py-2 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
		disabled={loading}
	>
		{#if loading}
			Loading...
		{:else}
			Login
		{/if}
	</button>

	<p class="text-center text-sm text-surface-500 mt-4">
		New here? <a href="/auth/register" class="text-primary-600 hover:underline">Create an account</a
		>
	</p>
</form>