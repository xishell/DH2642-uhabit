<script lang="ts">
	import '@skeletonlabs/skeleton-svelte'; // ensure skeleton is imported
	import { signIn } from '$lib/auth/client';
	import { toaster } from '$lib/stores/toaster';
	import { z } from 'zod';

	let identifier = $state('');
	let password = $state('');
	let loading = $state(false);
	let identifierError = $state<string | null>(null);

	// Form is ready when both fields have content
	let isReady = $derived(identifier.trim().length > 0 && password.length > 0);

	// Validation: either valid email or valid username (3-20 chars, alphanumeric + underscore)
	const emailSchema = z.string().email();
	const usernameSchema = z
		.string()
		.min(3)
		.max(20)
		.regex(/^[a-zA-Z0-9_]+$/);

	function validateIdentifier() {
		identifierError = null;
		const value = identifier.trim();
		if (!value) return;

		const isEmail = value.includes('@');
		if (isEmail) {
			const result = emailSchema.safeParse(value);
			if (!result.success) {
				identifierError = 'Please enter a valid email address';
			}
		} else {
			const result = usernameSchema.safeParse(value);
			if (!result.success) {
				identifierError = 'Username must be 3-20 characters (letters, numbers, underscore)';
			}
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		identifierError = null;
		loading = true;

		const value = identifier.trim().toLowerCase();
		const isEmail = value.includes('@');

		// Validate before submission
		const result = isEmail ? emailSchema.safeParse(value) : usernameSchema.safeParse(value);
		if (!result.success) {
			identifierError = isEmail
				? 'Please enter a valid email address'
				: 'Username must be 3-20 characters (letters, numbers, underscore)';
			loading = false;
			return;
		}

		try {
			await signIn(value, password);
			window.location.href = '/overview';
		} catch (err) {
			toaster.error({
				title: 'Login failed',
				description: 'Invalid credentials. Please try again.'
			});
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<form class="space-y-6 max-w-md mx-auto p-6 bg-surface-100-800 rounded-xl" onsubmit={handleSubmit}>
	<h1 class="text-2xl font-semibold text-center">Login</h1>

	<div class="flex flex-col space-y-1">
		<label for="identifier" class="text-sm font-medium text-surface-700-200"
			>Email or Username</label
		>
		<input
			id="identifier"
			type="text"
			bind:value={identifier}
			onblur={validateIdentifier}
			required
			autocomplete="username"
			class="input px-4 py-2 border rounded-md bg-surface-50-900 focus:outline-none focus:ring-2
                  {identifierError
				? 'border-error-500 focus:ring-error-500'
				: 'border-surface-300-600 focus:ring-primary-500'}"
		/>
		{#if identifierError}
			<p class="text-sm text-error-600">{identifierError}</p>
		{/if}
	</div>

	<div class="flex flex-col space-y-1">
		<label for="password" class="text-sm font-medium text-surface-700-200">Password</label>
		<input
			id="password"
			type="password"
			bind:value={password}
			required
			class="input px-4 py-2 border border-surface-300-600 rounded-md
                  bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
	</div>

	<button
		type="submit"
		class="w-full py-3 px-6 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
			{isReady
			? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
			: 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400 border border-surface-300 dark:border-surface-600'}"
		disabled={loading}
	>
		{#if loading}
			Loading...
		{:else}
			Login
		{/if}
	</button>

	<p class="text-center text-sm text-surface-500 mt-4">
		New here? <a href="/register" class="text-primary-600 hover:underline">Create an account</a>
	</p>
</form>
