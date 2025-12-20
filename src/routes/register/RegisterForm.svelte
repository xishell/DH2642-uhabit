<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { signUp } from '$lib/auth/client';
	import PasswordStrengthIndicator from '$lib/components/PasswordStrengthIndicator.svelte';
	import RegisterErrorAlert from './RegisterErrorAlert.svelte';
	import {
		emailSchema,
		usernameSchema,
		validateEmailValue,
		validateUsernameValue
	} from './validation';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let errorHint = $state<string | null>(null);
	let emailError = $state<string | null>(null);
	let usernameError = $state<string | null>(null);

	// Validate email on blur for immediate feedback
	function validateEmail() {
		emailError = validateEmailValue(email);
	}

	// Validate username on blur for immediate feedback
	function validateUsername() {
		usernameError = validateUsernameValue(username);
	}

	function getErrorFeedback(err: unknown): { message: string; hint: string | null } {
		if (!(err instanceof Error)) {
			return {
				message: 'Something went wrong during registration.',
				hint: 'Please try again in a moment.'
			};
		}

		const msg = err.message.toLowerCase();
		const checks: { test: (m: string) => boolean; message: string; hint: string | null }[] = [
			{
				test: (m) =>
					m.includes('password') &&
					(m.includes('common') || m.includes('breach') || m.includes('compromised')),
				message: 'This password is too common and may be easy to guess.',
				hint: 'Try adding numbers, symbols, or making it longer.'
			},
			{
				test: (m) =>
					m.includes('password') &&
					(m.includes('weak') || m.includes('short') || m.includes('length')),
				message: "Your password doesn't meet the requirements.",
				hint: 'Check the password requirements below.'
			},
			{
				test: (m) => m.includes('password'),
				message: err.message,
				hint: 'Please choose a stronger password.'
			},
			{
				test: (m) =>
					m.includes('email') &&
					(m.includes('already') || m.includes('exists') || m.includes('taken')),
				message: 'An account with this email may already exist.',
				hint: 'login-hint'
			},
			{
				test: (m) => m.includes('email') && m.includes('invalid'),
				message: 'Please check your email address.',
				hint: "Make sure it's formatted correctly (e.g., name@example.com)."
			},
			{
				test: (m) =>
					m.includes('username') &&
					(m.includes('already') || m.includes('exists') || m.includes('taken')),
				message: 'This username is already taken.',
				hint: 'Please choose a different username.'
			},
			{
				test: (m) => m.includes('too many') || m.includes('rate limit'),
				message: 'Too many attempts. Please wait a moment.',
				hint: 'Try again in a few minutes.'
			},
			{
				test: (m) => m.includes('network') || m.includes('fetch') || m.includes('connection'),
				message: 'Connection problem. Please check your internet.',
				hint: 'Try refreshing the page and submitting again.'
			}
		];

		const match = checks.find((item) => item.test(msg));
		if (match) return { message: match.message, hint: match.hint };

		return {
			message: 'Something went wrong during registration.',
			hint: 'Please check your information and try again.'
		};
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = null;
		errorHint = null;
		emailError = null;
		usernameError = null;
		loading = true;

		const emailValidation = validateEmailValue(email);
		if (emailValidation) {
			emailError = emailValidation;
			loading = false;
			return;
		}
		email = emailSchema.parse(email);

		const usernameValidation = validateUsernameValue(username);
		if (usernameValidation) {
			usernameError = usernameValidation;
			loading = false;
			return;
		}
		username = usernameSchema.parse(username);

		try {
			await signUp({ email, password, username });
			window.location.href = '/overview';
		} catch (err) {
			const feedback = getErrorFeedback(err);
			errorMessage = feedback.message;
			errorHint = feedback.hint;
			console.error('Registration error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<form class="space-y-6 max-w-md mx-auto p-6 bg-surface-100-800 rounded-xl" onsubmit={handleSubmit}>
	<h1 class="text-2xl font-semibold text-center">Create an Account</h1>

	{#if errorMessage}
		<RegisterErrorAlert {errorMessage} {errorHint} />
	{/if}

	<div class="flex flex-col space-y-1">
		<label for="username" class="text-sm font-medium text-surface-700-200">Username</label>
		<input
			id="username"
			type="text"
			bind:value={username}
			onblur={validateUsername}
			placeholder="johndoe"
			required
			class="input px-4 py-2 border rounded-md bg-surface-50-900 focus:outline-none focus:ring-2
                  {usernameError
				? 'border-error-500 focus:ring-error-500'
				: 'border-surface-300-600 focus:ring-primary-500'}"
		/>
		{#if usernameError}
			<p class="text-sm text-error-600">{usernameError}</p>
		{/if}
	</div>

	<div class="flex flex-col space-y-1">
		<label for="email" class="text-sm font-medium text-surface-700-200">Email</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			onblur={validateEmail}
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
		class="w-full py-3 px-6 bg-primary-200-800 text-primary-800-200 rounded-full hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
