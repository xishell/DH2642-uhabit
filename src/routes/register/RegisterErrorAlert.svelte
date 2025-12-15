<script lang="ts">
	let { errorMessage, errorHint }: { errorMessage: string; errorHint: string | null } = $props();
</script>

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
