<script lang="ts">
	import '@skeletonlabs/skeleton-svelte';
	import { authClient } from '$lib/auth/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let password = '';
	let confirmPassword = '';
	let loading = false;
	let errorMessage: string | null = null;
	let successMessage: string | null = null;
	let token: string | null = null;

	onMount(() => {
		// Get token from URL parameters
		const params = new URLSearchParams(window.location.search);
		token = params.get('token');

		if (!token) {
			errorMessage = 'Invalid or missing reset token. Please request a new password reset link.';
		}
	});

	async function handleSubmit() {
		errorMessage = null;
		successMessage = null;

		// Validate passwords
		if (password.length < 8) {
			errorMessage = 'Password must be at least 8 characters long.';
			return;
		}

		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}

		if (!token) {
			errorMessage = 'Invalid reset token.';
			return;
		}

		loading = true;

		try {
			const result = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			successMessage = 'Password reset successful! Redirecting to login...';
			setTimeout(() => {
				goto('/login');
			}, 2000);
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
			console.error('Reset password error:', err);
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
		<h1 class="text-2xl font-semibold text-center">Reset Password</h1>
		<p class="text-sm text-surface-500 text-center mt-2">Enter your new password below.</p>
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

	{#if token}
		<div class="flex flex-col space-y-1">
			<label for="password" class="text-sm font-medium text-surface-700 dark:text-surface-200"
				>New Password</label
			>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="••••••••"
				required
				minlength="8"
				class="input px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md
                  bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
		</div>

		<div class="flex flex-col space-y-1">
			<label
				for="confirm-password"
				class="text-sm font-medium text-surface-700 dark:text-surface-200"
				>Confirm Password</label
			>
			<input
				id="confirm-password"
				type="password"
				bind:value={confirmPassword}
				placeholder="••••••••"
				required
				minlength="8"
				class="input px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-md
                  bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
		</div>

		<button
			type="submit"
			class="btn variant-filled w-full py-2 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={loading || !token}
		>
			{#if loading}
				Resetting...
			{:else}
				Reset Password
			{/if}
		</button>
	{/if}

	<p class="text-center text-sm text-surface-500 mt-4">
		Remember your password? <a href="/login" class="text-primary-600 hover:underline">Sign in</a
		>
	</p>
</form>
