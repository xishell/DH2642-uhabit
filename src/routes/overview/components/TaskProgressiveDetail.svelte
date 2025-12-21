<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { Plus, Minus, Loader2 } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	let {
		selectedProgressive,
		initialProgress = null,
		onSave = () => {},
		onClose = () => {},
		onProgressChange = () => {}
	}: {
		selectedProgressive: HabitWithStatus;
		initialProgress?: number | null;
		onSave?: (data: HabitWithStatus) => Promise<void> | void;
		onClose?: () => void;
		onProgressChange?: (progress: number) => void;
	} = $props();

	let progress = $state(untrack(() => initialProgress ?? selectedProgressive.progress));
	let isSaving = $state(false);

	const target = $derived(selectedProgressive.habit.targetAmount ?? 0);
	const pct = $derived(target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0);
	const unit = $derived(selectedProgressive.habit.unit ?? '');
	const isCompleted = $derived(progress >= target && target > 0);

	function increment() {
		if (progress < target) {
			progress += 1;
			onProgressChange(progress);
		}
	}

	function decrement() {
		if (progress > 0) {
			progress -= 1;
			onProgressChange(progress);
		}
	}

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = parseInt(input.value, 10);
		if (!isNaN(value)) {
			progress = Math.max(0, Math.min(target, value));
			onProgressChange(progress);
		} else {
			input.value = progress.toString();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Save on Enter key
		if (e.key === 'Enter') {
			e.preventDefault();
			save();
			return;
		}

		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
			e.preventDefault();
		}
	}

	async function save() {
		if (isSaving) return;
		isSaving = true;
		try {
			await onSave?.({ ...selectedProgressive, progress });
		} finally {
			isSaving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<div
	class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div
		class="bg-surface-800 w-full md:w-96 rounded-t-xl md:rounded-xl p-6 flex flex-col items-center"
	>
		<!-- Header -->
		<div class="flex justify-between items-center w-full mb-6">
			<div class="font-semibold text-lg text-surface-50 flex-1 truncate">
				{selectedProgressive.habit.title}
			</div>
			<button
				onclick={onClose}
				class="text-surface-400 hover:text-surface-200 text-2xl font-bold ml-2 leading-none"
				aria-label="Close"
			>
				&times;
			</button>
		</div>

		<!-- Progress Circle -->
		<div class="relative w-32 h-32 mb-6">
			<Progress value={pct} max={100} class="w-full h-full">
				<Progress.Circle class="[--size:--spacing(32)]">
					<Progress.CircleTrack class="stroke-surface-700" />
					<Progress.CircleRange class={isCompleted ? 'stroke-primary-600' : 'stroke-primary-500'} />
				</Progress.Circle>
			</Progress>
			<div
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center"
			>
				<span class="text-2xl font-bold text-surface-50 leading-none">{progress}</span>
				<span class="text-xs text-surface-400 mt-1">of {target} {unit}</span>
			</div>
		</div>

		<!-- Increment / Decrement -->
		<div class="flex items-center gap-8 mb-6">
			<button
				onclick={decrement}
				disabled={progress <= 0 || isSaving}
				class="w-12 h-12 rounded-full border-2 border-surface-600 hover:border-surface-500 hover:bg-surface-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Minus class="w-5 h-5 text-surface-300" />
			</button>
			<input
				type="number"
				inputmode="numeric"
				bind:value={progress}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				min="0"
				max={target}
				disabled={isSaving}
				class="text-3xl font-bold text-surface-50 w-20 text-center bg-transparent border-b-2 border-surface-600 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
			/>
			<button
				onclick={increment}
				disabled={progress >= target || isSaving}
				class="w-12 h-12 rounded-full border-2 border-surface-600 hover:border-surface-500 hover:bg-surface-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Plus class="w-5 h-5 text-surface-300" />
			</button>
		</div>

		<!-- Save Button -->
		<button
			onclick={save}
			disabled={isSaving}
			class="w-full py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
		>
			{#if isSaving}
				<Loader2 class="w-5 h-5 animate-spin" />
				<span>Saving...</span>
			{:else}
				{isCompleted ? 'Save' : 'Update Progress'}
			{/if}
		</button>
	</div>
</div>
