<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { password = '' }: { password?: string } = $props();

	interface Requirement {
		met: boolean;
		text: string;
	}

	const requirements = $derived([
		{ met: password.length >= 8, text: 'At least 8 characters' },
		{ met: /[A-Z]/.test(password), text: 'One uppercase letter' },
		{ met: /[a-z]/.test(password), text: 'One lowercase letter' },
		{ met: /[0-9]/.test(password), text: 'One number' }
	] as Requirement[]);

	const hasSpecialChar = $derived(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
	const allRequirementsMet = $derived(requirements.every((r) => r.met));

	// Calculate strength percentage
	const strength = $derived.by(() => {
		if (!password) return 0;
		let score = 0;

		if (password.length >= 8) score += 25;
		if (password.length >= 12) score += 15;
		if (/[A-Z]/.test(password)) score += 20;
		if (/[a-z]/.test(password)) score += 20;
		if (/[0-9]/.test(password)) score += 20;
		if (hasSpecialChar) score += 20;

		// Penalize weak patterns
		if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated chars
		if (/^[0-9]+$/.test(password)) score -= 20; // Only numbers

		return Math.max(0, Math.min(100, score));
	});

	const strengthLabel = $derived.by(() => {
		if (strength === 0) return '';
		if (strength < 40) return 'Weak';
		if (strength < 70) return 'Medium';
		return 'Strong';
	});

	const strengthColor = $derived.by(() => {
		if (strength < 40) return 'bg-error-500';
		if (strength < 70) return 'bg-warning-500';
		return 'bg-success-500';
	});

	const textColor = $derived.by(() => {
		if (strength < 40) return 'text-error-600';
		if (strength < 70) return 'text-warning-600';
		return 'text-success-600';
	});
</script>

{#if password}
	<div class="mt-2 space-y-2" transition:slide={{ duration: 300, easing: cubicOut }}>
		<!-- Strength bar using Skeleton Progress component -->
		<div class="flex items-center gap-2" in:fade={{ duration: 200, delay: 100 }}>
			<div class="flex-1">
				<Progress value={strength}>
					<Progress.Track class="h-2 bg-surface-200 dark:bg-surface-700">
						<Progress.Range class="{strengthColor} transition-all duration-300" />
					</Progress.Track>
				</Progress>
			</div>
			{#if strengthLabel}
				<span class="text-sm font-medium w-16 {textColor}">
					{strengthLabel}
				</span>
			{/if}
		</div>

		<!-- Requirements checklist -->
		<div class="text-sm space-y-1" in:fade={{ duration: 300, delay: 200 }}>
			{#each requirements as req}
				<div class="flex items-center gap-2">
					{#if req.met}
						<svg class="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<svg class="w-4 h-4 text-surface-400" fill="currentColor" viewBox="0 0 20 20">
							<circle cx="10" cy="10" r="3" />
						</svg>
					{/if}
					<span class:text-success-600={req.met} class:text-surface-600={!req.met}>
						{req.text}
					</span>
				</div>
			{/each}

			<!-- Special character  -->
			<div class="flex items-center gap-2">
				{#if hasSpecialChar}
					<svg class="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="w-4 h-4 text-surface-400" fill="currentColor" viewBox="0 0 20 20">
						<circle cx="10" cy="10" r="3" />
					</svg>
				{/if}
				<span class:text-success-600={hasSpecialChar} class:text-surface-400={!hasSpecialChar}>
					One special character (recommended)
				</span>
			</div>
		</div>
	</div>
{/if}
