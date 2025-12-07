<script lang="ts">
	import '@skeletonlabs/skeleton-svelte'; // ensure skeleton is imported
	import { signIn } from '$lib/auth/client';
	import { z } from 'zod';

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
			await signIn(email, password);
			window.location.href = '/overview';
		} catch (err) {
			errorMessage = 'Invalid email or password. Please try again.';
			console.error('Login error:', err); // Log for debugging
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="max-w-sm mx-auto px-6 py-8 rounded-lg shadow-sm"
	on:submit|preventDefault={handleSubmit}
>
	<h1 class="text-xl font-semibold mb-1">Welcome back</h1>
	<p class="text-sm text-surface-500 mb-8">Sign in to continue</p>

	{#if errorMessage}
		<div class="p-3 mb-6 border border-error-500 text-error-500 rounded-lg text-sm">
			{errorMessage}
		</div>
	{/if}

	<div class="space-y-6">
		<label class="block relative">
			<span class="text-sm text-surface-500 mb-1.5 block">Email</span>
			<div class="relative">
				<input
					id="email"
					type="email"
					bind:value={email}
					on:blur={(e) => {
						validateEmail();
						const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
						if (glow) {
							glow.classList.remove('glow-in');
							glow.classList.add('glow-out');
						}
					}}
					required
					placeholder="you@example.com"
					class="w-full border-b bg-transparent py-2 text-sm focus:outline-none transition-colors relative z-10
						{emailError ? 'border-error-500' : 'border-surface-300-600'}"
					on:focus={(e) => {
						const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
						if (glow) {
							glow.classList.remove('glow-out');
							glow.classList.add('glow-in');
						}
					}}
				/>
				<div class="border-glow absolute bottom-0 left-0 w-full h-[2px] bg-primary-500 z-20"></div>
			</div>
			{#if emailError}
				<p class="text-xs text-error-500 mt-1">{emailError}</p>
			{/if}
		</label>

		<label class="block relative">
			<span class="text-sm text-surface-500 mb-1.5 block">Password</span>
			<div class="relative">
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					placeholder="••••••••"
					class="w-full border-b border-surface-300-600 bg-transparent py-2 text-sm focus:outline-none transition-colors relative z-10"
					on:focus={(e) => {
						const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
						if (glow) {
							glow.classList.remove('glow-out');
							glow.classList.add('glow-in');
						}
					}}
					on:blur={(e) => {
						const glow = e.currentTarget.parentElement?.querySelector('.border-glow');
						if (glow) {
							glow.classList.remove('glow-in');
							glow.classList.add('glow-out');
						}
					}}
				/>
				<div class="border-glow absolute bottom-0 left-0 w-full h-[2px] bg-primary-500 z-20"></div>
			</div>
		</label>
	</div>

	<button
		type="submit"
		class="w-full mt-8 py-2.5 text-sm font-medium bg-surface-900-50 text-surface-50-900 rounded-lg disabled:opacity-50 hover:opacity-80 shadow-md hover:shadow-lg transition-all"
		disabled={loading}
	>
		{#if loading}
			<span class="inline-block size-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2"></span>
			Signing in...
		{:else}
			Sign in
		{/if}
	</button>

	<p class="text-center text-sm text-surface-500 mt-6">
		New here? <a href="/register" class="text-surface-900-50 font-medium hover:opacity-70 transition-opacity">Create an account</a>
	</p>
</form>
