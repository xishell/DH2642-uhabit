<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	let { errorMessage, errorHint }: { errorMessage: string; errorHint: string | null } = $props();
</script>

<div
	class="p-4 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg"
	role="alert"
>
	<div class="flex items-start gap-3">
		<AlertTriangle size={20} class="text-error-500 flex-shrink-0 mt-0.5" />
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
