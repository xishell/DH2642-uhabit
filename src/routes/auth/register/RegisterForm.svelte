<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { signUp } from '$lib/auth/client';

	let name = '';
	let email = '';
	let password = '';
	let loading = false;
	let errorMessage: string | null = null;

	async function handleSubmit() {
		errorMessage = null;
		loading = true;
		try {
			await signUp(email, password, name);
			window.location.href = '/overview';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-6 max-w-md mx-auto p-6 bg-surface-100 dark:bg-surface-800 rounded-xl shadow-md"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-2xl font-semibold text-center">Create an Account</h1>

	{#if errorMessage}
		<div class="p-3 bg-error-100 text-error-700 rounded">{errorMessage}</div>
	{/if}

	<div class="flex flex-col space-y-1">
		<label for="name" class="text-sm font-medium text-surface-700 dark:text-surface-200">Name</label
		>
		<input
			id="name"
			type="text"
			bind:value={name}
			placeholder="Your name"
			required
			class="input px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md
                  bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
	</div>

	<div class="flex flex-col space-y-1">
		<label for="email" class="text-sm font-medium text-surface-700 dark:text-surface-200"
			>Email</label
		>
		<input
			id="email"
			type="email"
			bind:value={email}
			placeholder="you@example.com"
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
			placeholder="••••••••"
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
			Creating...
		{:else}
			Create Account
		{/if}
	</button>

	<p class="text-center text-sm text-surface-500 mt-4">
		Already have an account?
		<a href="/auth/login" class="text-primary-600 hover:underline">Sign in</a>
	</p>
</form>
