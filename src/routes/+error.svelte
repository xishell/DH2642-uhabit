<script lang="ts">
	import { page } from '$app/stores';
	import { AlertTriangle, Home, ArrowLeft } from 'lucide-svelte';
</script>

<div class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
	<div class="text-center max-w-md p-8 bg-surface-100 dark:bg-surface-800 rounded-xl shadow-lg">
		<div class="mx-auto mb-6 p-3 rounded-full bg-error-100 dark:bg-error-900/30 w-fit">
			<AlertTriangle class="size-10 text-error-600 dark:text-error-400" />
		</div>

		<h1 class="text-4xl font-bold mb-2">{$page.status}</h1>
		<p class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
			{#if $page.status === 404}
				Page not found
			{:else if $page.status === 500}
				Server error
			{:else}
				Something went wrong
			{/if}
		</p>
		<p class="text-sm text-surface-500 dark:text-surface-400 mb-6">
			{$page.error?.message || "We couldn't find what you were looking for."}
		</p>

		<div class="flex gap-3 justify-center flex-wrap">
			<a
				href="/overview"
				class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
			>
				<Home class="size-4" />
				Go Home
			</a>
			<button
				onclick={() => history.back()}
				class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
			>
				<ArrowLeft class="size-4" />
				Go Back
			</button>
		</div>
	</div>
</div>
