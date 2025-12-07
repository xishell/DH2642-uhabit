<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { signUp } from '$lib/auth/client';
	import PasswordStrengthIndicator from '$lib/components/PasswordStrengthIndicator.svelte';
	import { z } from 'zod';

	let name = '';
	let email = '';
	let password = '';
	let loading = false;
	let errorMessage: string | null = null;
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
			await signUp(email, password, name);
			window.location.href = '/overview';
		} catch (err) {
			if (err instanceof Error) {
				const msg = err.message.toLowerCase();
				// If it's a password validation error, show it
				if (msg.includes('password') && (msg.includes('must') || msg.includes('character'))) {
					errorMessage = err.message;
				} else if (msg.includes('email') && msg.includes('already')) {
					// Generic message - don't confirm email exists
					errorMessage = 'Registration failed. Please try a different email.';
				} else {
					errorMessage = 'Registration failed. Please check your information and try again.';
				}
			} else {
				errorMessage = 'Registration failed. Please try again.';
			}
			console.error('Registration error:', err); // Log for debugging
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-6 max-w-md mx-auto p-6 bg-surface-100-800 rounded-xl"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-2xl font-semibold text-center">Create an Account</h1>

	{#if errorMessage}
		<div class="p-3 bg-error-100 text-error-700 rounded">{errorMessage}</div>
	{/if}

	<div class="flex flex-col space-y-1">
		<label for="name" class="text-sm font-medium text-surface-700-200">Name</label>
		<input
			id="name"
			type="text"
			bind:value={name}
			placeholder="Your name"
			required
			class="input px-4 py-2 border border-surface-300-600 rounded-md
                  bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
	</div>

	<div class="flex flex-col space-y-1">
		<label for="email" class="text-sm font-medium text-surface-700-200">Email</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			on:blur={validateEmail}
			placeholder="you@example.com"
			required
			class="input px-4 py-2 border rounded-md bg-surface-50-900 focus:outline-none focus:ring-2
                  {emailError
				? 'border-error-500 focus:ring-error-500'
				: 'border-surface-300-600 focus:ring-primary-500'}"
		/>
		{#if emailError}
			<p class="text-sm text-error-600">{emailError}</p>
		{/if}
	</div>

	<div class="flex flex-col space-y-1">
		<label for="password" class="text-sm font-medium text-surface-700-200">Password</label>
		<input
			id="password"
			type="password"
			bind:value={password}
			placeholder="••••••••"
			required
			minlength="8"
			class="input px-4 py-2 border border-surface-300-600 rounded-md
                  bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
		/>
		<PasswordStrengthIndicator {password} />
	</div>

	<button
		type="submit"
		class="w-full py-3 px-6 bg-primary-200-800 text-primary-800-200 rounded-[50px] hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
		<a href="/login" class="text-primary-600 hover:underline">Sign in</a>
	</p>
</form>
