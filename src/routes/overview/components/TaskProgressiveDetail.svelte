<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { Plus, Minus } from 'lucide-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let selectedProgressive: HabitWithStatus;
	export let initialProgress: number | null = null;
	export let onSave: (data: HabitWithStatus) => void = () => {};
	export let onClose: () => void = () => {};
	export let onProgressChange: (progress: number) => void = () => {};

	let progress = initialProgress ?? selectedProgressive.progress;

	$: target = selectedProgressive.habit.targetAmount ?? 0;
	$: pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
	$: unit = selectedProgressive.habit.unit ?? '';
	$: isCompleted = progress >= target && target > 0;

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
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
		if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
			e.preventDefault();
		}
	}

	function save() {
		onSave?.({ ...selectedProgressive, progress });
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<div
	class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
	on:click={handleBackdropClick}
	on:keydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div
		class="bg-surface-800 w-full md:w-96 rounded-t-xl md:rounded-xl p-6 flex flex-col items-center"
	>
		<!-- Header -->
		<div class="flex justify-between items-center w-full mb-6">
			<div class="font-semibold text-lg text-surface-50 flex-1">
				{selectedProgressive.habit.title}
			</div>
			<button
				on:click={onClose}
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
					<Progress.CircleRange class={isCompleted ? 'stroke-violet-500' : 'stroke-primary-500'} />
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
				on:click={decrement}
				disabled={progress <= 0}
				class="w-12 h-12 rounded-full border-2 border-surface-600 hover:border-surface-500 hover:bg-surface-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Minus class="w-5 h-5 text-surface-300" />
			</button>
			<input
				type="number"
				inputmode="numeric"
				bind:value={progress}
				on:input={handleInput}
				on:keydown={handleKeyDown}
				min="0"
				max={target}
				class="text-3xl font-bold text-surface-50 w-20 text-center bg-transparent border-b-2 border-surface-600 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
			/>
			<button
				on:click={increment}
				disabled={progress >= target}
				class="w-12 h-12 rounded-full border-2 border-surface-600 hover:border-surface-500 hover:bg-surface-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<Plus class="w-5 h-5 text-surface-300" />
			</button>
		</div>

		<!-- Save Button -->
		<button
			on:click={save}
			class="w-full py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition"
		>
			{isCompleted ? 'Save' : 'Update Progress'}
		</button>
	</div>
</div>
