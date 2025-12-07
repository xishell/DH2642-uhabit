<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { forgetPassword } from '$lib/auth/client';
	import { z } from 'zod';

	let email = '';
	let loading = false;
	let errorMessage: string | null = null;
	let successMessage: string | null = null;
	let emailError: string | null = null;

	// Email validation schema
	const emailSchema = z.string().email('Please enter a valid email address').toLowerCase();

	// Validate email on blur for immediate feedback
	function validateEmail() {
		emailError = null;
		try {
			emailSchema.parse(email);
		} catch (err) {
			if (err instanceof z.ZodError) {
				emailError = err.issues[0].message;
			}
		}
	}

	async function handleSubmit() {
		errorMessage = null;
		successMessage = null;
		emailError = null;
		loading = true;

		// Validate email before submission
		try {
			email = emailSchema.parse(email);
		} catch (err) {
			if (err instanceof z.ZodError) {
				emailError = err.issues[0].message;
				loading = false;
				return;
			}
		}

		try {
			await forgetPassword(email);
			successMessage =
				'If an account exists with this email, you will receive a password reset link shortly.';
			email = ''; // Clear the form
		} catch (err) {
			errorMessage = 'An error occurred. Please try again later.';
			console.error('Forgot password error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-6 max-w-md mx-auto p-6 bg-surface-100 dark:bg-surface-800 rounded-xl shadow-md"
	on:submit|preventDefault={handleSubmit}
>
	<div>
		<h1 class="text-2xl font-semibold text-center">Forgot Password</h1>
		<p class="text-sm text-surface-500 text-center mt-2">
			Enter your email address and we'll send you a link to reset your password.
		</p>
	</div>

	{#if errorMessage}
		<div class="p-3 bg-error-100 text-error-700 rounded">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="p-3 bg-success-100 text-success-700 rounded">
			{successMessage}
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
			on:blur={validateEmail}
			placeholder="you@example.com"
			required
			class="input px-4 py-2 border rounded-md bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2
                  {emailError
				? 'border-error-500 focus:ring-error-500'
				: 'border-surface-300 dark:border-surface-600 focus:ring-primary-500'}"
		/>
		{#if emailError}
			<p class="text-sm text-error-600">{emailError}</p>
		{/if}
	</div>

	<button
		type="submit"
		class="btn variant-filled w-full py-2 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
		disabled={loading}
	>
		{#if loading}
			Sending...
		{:else}
			Send Reset Link
		{/if}
	</button>

	<p class="text-center text-sm text-surface-500 mt-4">
		Remember your password? <a href="/login" class="text-primary-600 hover:underline">Sign in</a>
	</p>
</form>
