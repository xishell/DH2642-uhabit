<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { signUp } from '$lib/auth/client';
	import PasswordStrengthIndicator from '$lib/components/PasswordStrengthIndicator.svelte';
	import { toaster } from '$lib/stores/toaster';
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
	let emailError = $state<string | null>(null);
	let usernameError = $state<string | null>(null);

	// Form is ready when all fields have content and password meets minimum length
	let isReady = $derived(
		username.trim().length > 0 && email.trim().length > 0 && password.length >= 8
	);

	// Validate email on blur for immediate feedback
	function validateEmail() {
		emailError = validateEmailValue(email);
	}

	// Validate username on blur for immediate feedback
	function validateUsername() {
		usernameError = validateUsernameValue(username);
	}

	function getErrorFeedback(err: unknown): { title: string; description: string } {
		if (!(err instanceof Error)) {
			return {
				title: 'Registration failed',
				description: 'Something went wrong. Please try again in a moment.'
			};
		}

		const msg = err.message.toLowerCase();
		const checks: { test: (m: string) => boolean; title: string; description: string }[] = [
			{
				test: (m) =>
					m.includes('password') &&
					(m.includes('common') || m.includes('breach') || m.includes('compromised')),
				title: 'Password too common',
				description: 'Try adding numbers, symbols, or making it longer.'
			},
			{
				test: (m) =>
					m.includes('password') &&
					(m.includes('weak') || m.includes('short') || m.includes('length')),
				title: 'Password too weak',
				description: 'Check the password requirements below.'
			},
			{
				test: (m) => m.includes('password'),
				title: 'Password issue',
				description: 'Please choose a stronger password.'
			},
			{
				test: (m) =>
					m.includes('email') &&
					(m.includes('already') || m.includes('exists') || m.includes('taken')),
				title: 'Email already registered',
				description: 'Try logging in instead, or use a different email.'
			},
			{
				test: (m) => m.includes('email') && m.includes('invalid'),
				title: 'Invalid email',
				description: "Make sure it's formatted correctly (e.g., name@example.com)."
			},
			{
				test: (m) =>
					m.includes('username') &&
					(m.includes('already') || m.includes('exists') || m.includes('taken')),
				title: 'Username taken',
				description: 'Please choose a different username.'
			},
			{
				test: (m) => m.includes('too many') || m.includes('rate limit'),
				title: 'Too many attempts',
				description: 'Please wait a few minutes and try again.'
			},
			{
				test: (m) => m.includes('network') || m.includes('fetch') || m.includes('connection'),
				title: 'Connection problem',
				description: 'Check your internet and try again.'
			}
		];

		const match = checks.find((item) => item.test(msg));
		if (match) return { title: match.title, description: match.description };

		return {
			title: 'Registration failed',
			description: 'Please check your information and try again.'
		};
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
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
			toaster.error(feedback);
			console.error('Registration error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<form class="space-y-6 max-w-md mx-auto p-6 bg-surface-100-800 rounded-xl" onsubmit={handleSubmit}>
	<h1 class="text-2xl font-semibold text-center">Create an Account</h1>

	<div class="flex flex-col space-y-1">
		<label for="username" class="text-sm font-medium text-surface-700-200">Username</label>
		<input
			id="username"
			type="text"
			bind:value={username}
			onblur={validateUsername}
			placeholder="johndoe"
			required
			class="input px-4 py-2 border rounded-md bg-surface-50-900 focus:outline-none focus:ring-2 placeholder:text-surface-400 dark:placeholder:text-surface-500
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
			class="input px-4 py-2 border rounded-md bg-surface-50-900 focus:outline-none focus:ring-2 placeholder:text-surface-400 dark:placeholder:text-surface-500
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
                  bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-surface-400 dark:placeholder:text-surface-500"
		/>
		<PasswordStrengthIndicator {password} />
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
