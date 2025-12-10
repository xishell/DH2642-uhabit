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
	let errorHint: string | null = null;
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
		errorHint = null;
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

				// Password-related errors
				if (
					msg.includes('password') &&
					(msg.includes('common') || msg.includes('breach') || msg.includes('compromised'))
				) {
					errorMessage = 'This password is too common and may be easy to guess.';
					errorHint = 'Try adding numbers, symbols, or making it longer.';
				} else if (
					msg.includes('password') &&
					(msg.includes('weak') || msg.includes('short') || msg.includes('length'))
				) {
					errorMessage = "Your password doesn't meet the requirements.";
					errorHint = 'Check the password requirements below.';
				} else if (msg.includes('password')) {
					errorMessage = err.message;
					errorHint = 'Please choose a stronger password.';
				}
				// Email-related errors
				else if (
					msg.includes('email') &&
					(msg.includes('already') || msg.includes('exists') || msg.includes('taken'))
				) {
					errorMessage = 'An account with this email may already exist.';
					errorHint = 'login-hint';
				} else if (msg.includes('email') && msg.includes('invalid')) {
					errorMessage = 'Please check your email address.';
					errorHint = "Make sure it's formatted correctly (e.g., name@example.com).";
				}
				// Rate limiting
				else if (msg.includes('too many') || msg.includes('rate limit')) {
					errorMessage = 'Too many attempts. Please wait a moment.';
					errorHint = 'Try again in a few minutes.';
				}
				// Network/server errors
				else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
					errorMessage = 'Connection problem. Please check your internet.';
					errorHint = 'Try refreshing the page and submitting again.';
				}
				// Generic fallback
				else {
					errorMessage = 'Something went wrong during registration.';
					errorHint = 'Please check your information and try again.';
				}
			} else {
				errorMessage = 'Something went wrong during registration.';
				errorHint = 'Please try again in a moment.';
			}
			console.error('Registration error:', err);
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
		<div
			class="p-4 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg"
			role="alert"
		>
			<div class="flex items-start gap-3">
				<svg
					class="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div class="flex-1">
					<p class="font-medium text-error-700 dark:text-error-300">{errorMessage}</p>
					{#if errorHint === 'login-hint'}
						<p class="mt-1 text-sm text-error-600 dark:text-error-400">
							Try <a
								href="/login"
								class="underline font-medium hover:text-error-800 dark:hover:text-error-200"
								>signing in</a
							> instead, or use a different email.
						</p>
					{:else if errorHint}
						<p class="mt-1 text-sm text-error-600 dark:text-error-400">{errorHint}</p>
					{/if}
				</div>
			</div>
		</div>
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
